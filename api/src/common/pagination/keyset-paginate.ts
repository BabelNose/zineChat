import { SelectQueryBuilder } from 'typeorm';
import { CursorCodecService } from './cursor-codec.service.js';
import { PaginatedResult } from './paginated-result.interface.js';

interface KeysetEntity {
    id: string;
}

export interface KeysetPaginateOptions<T extends KeysetEntity> {
    limit: number;
    cursor?: string;
    direction: 'ASC' | 'DESC';
    alias: string;
    idQueryBuilder: SelectQueryBuilder<T>;
    hydrate: (ids: string[]) => Promise<T[]>;
}

/**
 * Keyset-paginates a query by `id` (UUIDv7, so id order is already time order).
 *
 * Queries ids only against `idQueryBuilder` (no to-many joins, which would
 * multiply rows and break `take(limit)`), then hydrates the resulting page of
 * ids into full entities via `hydrate`.
 *
 * @param cursorCodec Encrypts/decrypts the encoded cursor string.
 * @param options.limit Page size.
 * @param options.cursor Encoded cursor from a previous page, or omitted for the first page.
 * @param options.direction Sort direction; also which side of the cursor the next page reads from.
 * @param options.alias The query builder's root alias, used to qualify `id` in SQL.
 * @param options.idQueryBuilder Query builder scoped/filtered as needed, selecting only ids.
 * @param options.hydrate Loads the full entities (with relations) for a page of ids, in any order.
 * @returns The page's items (re-ordered to match the id order) and a `nextCursor`, or `null` if this was the last page.
 */
export async function paginateByCursor<T extends KeysetEntity>(
    cursorCodec: CursorCodecService,
    options: KeysetPaginateOptions<T>,
): Promise<PaginatedResult<T>> {
    const { limit, cursor, direction, alias, idQueryBuilder, hydrate } = options;

    if (cursor) {
        const decoded = cursorCodec.decode(cursor);
        const operator = direction === 'DESC' ? '<' : '>';
        // Ids are UUIDv7, which are themselves time-ordered, so sorting/comparing
        // on id alone is enough to keyset-paginate without a separate timestamp.
        idQueryBuilder.andWhere(`${alias}.id ${operator} :cursorId::uuid`, {
            cursorId: decoded.id,
        });
    }

    const rows = await idQueryBuilder
        .select([`${alias}.id`])
        .orderBy(`${alias}.id`, direction)
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
    const nextCursor = hasMore && last ? cursorCodec.encode({ id: last.id }) : null;

    return { items: orderedItems, nextCursor };
}
