ALTER TABLE analysis_batches
  ADD COLUMN IF NOT EXISTS analysis_type TEXT NOT NULL DEFAULT 'online';

ALTER TABLE analysis_batches
  DROP CONSTRAINT IF EXISTS analysis_batches_analysis_type_check;

UPDATE analysis_batches
SET analysis_type = 'online'
WHERE analysis_type = 'customer';

UPDATE analysis_batches
SET analysis_type = 'online'
WHERE analysis_type IS NULL;

ALTER TABLE analysis_batches
  ALTER COLUMN analysis_type SET DEFAULT 'online';

ALTER TABLE analysis_batches
  ALTER COLUMN analysis_type SET NOT NULL;

ALTER TABLE analysis_batches
  ADD CONSTRAINT analysis_batches_analysis_type_check
  CHECK (analysis_type IN ('online', 'offline', 'quick'));
