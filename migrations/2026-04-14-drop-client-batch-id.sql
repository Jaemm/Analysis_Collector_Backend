DROP INDEX CONCURRENTLY IF EXISTS unique_analysis_batches_client_batch;

ALTER TABLE analysis_batches
  DROP COLUMN IF EXISTS client_batch_id;
