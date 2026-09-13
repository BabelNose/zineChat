import { SelectQueryBuilder } from 'typeorm';
import { CursorCodecService } from './cursor-codec.service.js';
import { PaginatedResult } from './paginated-result.interface.js';

interface KeysetEntity {
    id: string;
    created: Date;
}

export interface KeysetPaginateOptions<T extends KeysetEntity> {
    limit: number;
    cursor?: string;
    direction: 'ASC' | 'DESC';
    alias: string;
    /**
     * Query builder scoped/filtered as needed, but without joins to
     * to-many relations: those would multiply rows and break `take(limit)`.
     */
    idQueryBuilder: SelectQueryBuilder<T>;
    /** Loads the full entities (with relations) for a page of ids, in any order. */
    hydrate: (ids: string[]) => Promise<T[]>;
}

export async function paginateByCursor<T extends KeysetEntity>(
    cursorCodec: CursorCodecService,
    options: KeysetPaginateOptions<T>,
): Promise<PaginatedResult<T>> {
    const { limit, cursor, direction, alias, idQueryBuilder, hydrate } = options;

    if (cursor) {
        const decoded = cursorCodec.decode(cursor);
        const operator = direction === 'DESC' ? '<' : '>';
        idQueryBuilder.andWhere(
            `(${alias}.created, ${alias}.id) ${operator} (:cursorCreated::timestamptz, :cursorId::uuid)`,
            {
                cursorCreated: decoded.created,
                cursorId: decoded.id,
            },
        );
    }

    const rows = await idQueryBuilder
        .select([`${alias}.id`, `${alias}.created`])
        .orderBy(`${alias}.created`, direction)
        .addOrderBy(`${alias}.id`, direction)
        .take(limit + 1)
        .getMany();

    const hasMore = rows.length > limit;
    const page = hasMore ? rows.slice(0, limit) : rows;

    const items = page.length > 0 ? await hydrate(page.map((row) => row.id)) : [];
    const itemsById = new Map(items.map((item) => [item.id, item]));
    const orderedItems = page
        .map((row) => itemsById.get(row.id))
        .filter((item): item is T => item !== undefined);

    const last = page[page.length - 1];
    const nextCursor =
        hasMore && last ? cursorCodec.encode({ created: last.created.toISOString(), id: last.id }) : null;

    return { items: orderedItems, nextCursor };
}
