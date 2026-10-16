-- Idempotent. Safe to re-run anytime.
--
-- Not part of api/initdb (that only runs once, on a fresh/empty volume) and
-- not something TypeORM's `synchronize` can create (triggers aren't part of
-- its schema diff) - so this has to be applied manually, once, on every
-- environment after this change is deployed. See sync-search-cache.sh.
--
-- Adds a denormalized search cache to `question`: answerCount, commentCount,
-- and tagsCache. These are kept in sync by triggers below whenever an
-- answer/comment is added or removed, or a tag is attached, detached, or
-- renamed on a question - never by application code (question.entity.ts
-- marks them `update: false` for that reason).
--
-- Why: Ventstream mirrors `question` row-for-row into the zine_question
-- Meilisearch index, so once this cache lands on the row, search.service.ts
-- can read it straight off a question hit, or off one batched Meilisearch
-- lookup for an answer/comment hit's owning question - never Postgres.
-- See search.service.ts and search/README.md.

ALTER TABLE question
    ADD COLUMN IF NOT EXISTS "answerCount" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "commentCount" integer NOT NULL DEFAULT 0,
    ADD COLUMN IF NOT EXISTS "tagsCache" jsonb NOT NULL DEFAULT '[]';

CREATE OR REPLACE FUNCTION sync_question_search_cache(p_question_id uuid) RETURNS void AS $$
BEGIN
    UPDATE question
    SET
        "answerCount" = (SELECT count(*) FROM answer WHERE "questionId" = p_question_id),
        "commentCount" = (SELECT count(*) FROM comment WHERE "questionId" = p_question_id),
        "tagsCache" = (
            SELECT coalesce(jsonb_agg(jsonb_build_object('id', t.id, 'tag', t.tag) ORDER BY t.tag), '[]'::jsonb)
            FROM question_tag qt
            JOIN tag t ON t.id = qt.tag_id
            WHERE qt.question_id = p_question_id
        )
    WHERE id = p_question_id;
END;
$$ LANGUAGE plpgsql;

-- answer/comment added or removed -> recount on their question.
CREATE OR REPLACE FUNCTION trg_sync_question_cache_from_answer() RETURNS trigger AS $$
BEGIN
    PERFORM sync_question_search_cache(COALESCE(NEW."questionId", OLD."questionId"));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS answer_sync_question_cache ON answer;
CREATE TRIGGER answer_sync_question_cache
    AFTER INSERT OR DELETE ON answer
    FOR EACH ROW EXECUTE FUNCTION trg_sync_question_cache_from_answer();

CREATE OR REPLACE FUNCTION trg_sync_question_cache_from_comment() RETURNS trigger AS $$
BEGIN
    PERFORM sync_question_search_cache(COALESCE(NEW."questionId", OLD."questionId"));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comment_sync_question_cache ON comment;
CREATE TRIGGER comment_sync_question_cache
    AFTER INSERT OR DELETE ON comment
    FOR EACH ROW EXECUTE FUNCTION trg_sync_question_cache_from_comment();

-- Tag attached or detached (question_tag row added/removed) -> refresh tagsCache.
CREATE OR REPLACE FUNCTION trg_sync_question_cache_from_question_tag() RETURNS trigger AS $$
BEGIN
    PERFORM sync_question_search_cache(COALESCE(NEW.question_id, OLD.question_id));
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS question_tag_sync_question_cache ON question_tag;
CREATE TRIGGER question_tag_sync_question_cache
    AFTER INSERT OR DELETE ON question_tag
    FOR EACH ROW EXECUTE FUNCTION trg_sync_question_cache_from_question_tag();

-- Tag renamed -> refresh tagsCache on every question currently using it.
CREATE OR REPLACE FUNCTION trg_sync_question_cache_from_tag_rename() RETURNS trigger AS $$
BEGIN
    IF NEW.tag IS DISTINCT FROM OLD.tag THEN
        PERFORM sync_question_search_cache(qt.question_id)
        FROM question_tag qt
        WHERE qt.tag_id = NEW.id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tag_sync_question_cache ON tag;
CREATE TRIGGER tag_sync_question_cache
    AFTER UPDATE ON tag
    FOR EACH ROW EXECUTE FUNCTION trg_sync_question_cache_from_tag_rename();

-- Backfill every existing question - triggers only cover changes from here on.
-- Each of these UPDATEs is a real row change, so Ventstream streams the
-- refreshed cache into Meilisearch automatically; no separate search backfill
-- (search/scripts/backfill.sh) is needed just for this.
SELECT sync_question_search_cache(id) FROM question;
