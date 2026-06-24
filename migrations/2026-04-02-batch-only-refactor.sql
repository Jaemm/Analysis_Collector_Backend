BEGIN;

CREATE TABLE IF NOT EXISTS analysis_batches (
  id BIGSERIAL PRIMARY KEY,
  customer_id BIGINT,
  consultant_id BIGINT,
  consultant_email TEXT,
  app_id BIGINT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS analysis_result_files (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES analysis_batches(id) ON DELETE CASCADE,
  json_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS unique_batch_result_file
  ON analysis_result_files (batch_id, json_key);

CREATE INDEX IF NOT EXISTS idx_analysis_result_files_batch
  ON analysis_result_files (batch_id);

CREATE TABLE IF NOT EXISTS analysis_batch_images (
  id BIGSERIAL PRIMARY KEY,
  batch_id BIGINT NOT NULL REFERENCES analysis_batches(id) ON DELETE CASCADE,
  image_key TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_analysis_batch_images_batch
  ON analysis_batch_images (batch_id);

CREATE UNIQUE INDEX IF NOT EXISTS unique_batch_image_key
  ON analysis_batch_images (batch_id, image_key);

COMMIT;
