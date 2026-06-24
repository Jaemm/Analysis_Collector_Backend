CREATE TABLE IF NOT EXISTS offline_timestamp (
  id SERIAL PRIMARY KEY,
  mode VARCHAR,
  onoff_mode VARCHAR,
  consultant_id INTEGER,
  consultant_company_id INTEGER,
  customer_id INTEGER,
  optic_number VARCHAR,
  app_id INTEGER,
  batch_id INTEGER,
  crm JSONB,
  questionnaire JSONB,
  capture JSONB,
  analysis JSONB,
  result JSONB
);
