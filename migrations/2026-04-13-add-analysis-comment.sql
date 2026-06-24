ALTER TABLE analysis_batches
  ADD COLUMN IF NOT EXISTS analysis_comment TEXT;

