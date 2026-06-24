ALTER TABLE analysis_batches
  ADD COLUMN IF NOT EXISTS device_id TEXT;
