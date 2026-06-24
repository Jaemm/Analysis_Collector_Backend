ALTER TABLE analysis_batches
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS deleted_by TEXT;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_batches_active
  ON analysis_batches (id)
  WHERE deleted_at IS NULL;
