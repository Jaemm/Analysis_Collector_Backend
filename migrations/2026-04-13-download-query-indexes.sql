CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_batches_customer_created
  ON analysis_batches (customer_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_analysis_batches_consultant_created
  ON analysis_batches (consultant_id, created_at DESC);
