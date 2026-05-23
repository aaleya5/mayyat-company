-- =============================================================================
-- Mayyat Records — Custom migration SQL
-- Run AFTER `prisma migrate dev` generates the base tables.
--
-- This file adds everything Prisma can't express in schema.prisma:
--   1. pg_trgm extension (trigram similarity for partial name search)
--   2. GIN index on name via trigrams
--   3. GIN index on search_vector (full-text search)
--   4. Postgres function + trigger to auto-maintain search_vector
--
-- File: prisma/migrations/custom/001_search_indexes.sql
-- Run manually once: psql $DATABASE_URL -f this_file.sql
-- Or call it from seed.ts after migrate deploy in CI.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Extensions
-- ---------------------------------------------------------------------------

-- pg_trgm: enables trigram-based LIKE/ILIKE acceleration and similarity()
-- This is what makes "meh" match "mehfuzaben" without a full-text index.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- unaccent: strips diacritics during full-text search so "Husain" matches
-- "Husáin" and vice versa. Optional but useful given transliteration drift.
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ---------------------------------------------------------------------------
-- 2. GIN trigram index on name
-- ---------------------------------------------------------------------------

-- Allows fast ILIKE '%search_term%' queries on the name column.
-- GIN + gin_trgm_ops is required — a plain B-tree index won't help with LIKE.
-- Index also covers relative_name for "search by relative" queries.
CREATE INDEX IF NOT EXISTS idx_records_name_trgm
  ON records USING GIN (name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_records_relative_trgm
  ON records USING GIN (relative_name gin_trgm_ops);

-- ---------------------------------------------------------------------------
-- 3. Full-text search: function to build the tsvector
-- ---------------------------------------------------------------------------

-- We combine name, relative_name, and misri_date into one searchable document.
-- Weights: name = A (highest), relative_name = B, misri_date = C (lowest).
-- unaccent() strips diacritics from all three columns before indexing.
CREATE OR REPLACE FUNCTION records_search_vector(
  p_name         TEXT,
  p_relative     TEXT,
  p_misri_date   TEXT
) RETURNS tsvector
LANGUAGE plpgsql IMMUTABLE PARALLEL SAFE AS $$
BEGIN
  RETURN
    setweight(to_tsvector('simple', unaccent(coalesce(p_name, ''))),        'A') ||
    setweight(to_tsvector('simple', unaccent(coalesce(p_relative, ''))),    'B') ||
    setweight(to_tsvector('simple', unaccent(coalesce(p_misri_date, ''))),  'C');
END;
$$;

-- ---------------------------------------------------------------------------
-- 4. Trigger to keep search_vector in sync automatically
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION records_search_vector_trigger()
RETURNS trigger
LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector := records_search_vector(
    NEW.name,
    NEW.relative_name,
    NEW.misri_date
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_records_search_vector ON records;

CREATE TRIGGER trg_records_search_vector
  BEFORE INSERT OR UPDATE OF name, relative_name, misri_date
  ON records
  FOR EACH ROW
  EXECUTE FUNCTION records_search_vector_trigger();

-- ---------------------------------------------------------------------------
-- 5. GIN index on search_vector
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_records_search_vector
  ON records USING GIN (search_vector);

-- ---------------------------------------------------------------------------
-- 6. Backfill search_vector for existing rows (run once after import)
-- ---------------------------------------------------------------------------

UPDATE records
SET search_vector = records_search_vector(name, relative_name, misri_date)
WHERE search_vector IS NULL;

-- ---------------------------------------------------------------------------
-- 7. Composite index for the most common list query
--    "show me all non-deleted records ordered by burial_date DESC"
-- ---------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_records_active_by_date
  ON records (burial_date DESC)
  WHERE is_deleted = FALSE;
