CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_batches_customer_active_created
  ON analysis_batches (customer_id, created_at DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_batches_consultant_active_created
  ON analysis_batches (consultant_id, created_at DESC)
  WHERE deleted_at IS NULL;
