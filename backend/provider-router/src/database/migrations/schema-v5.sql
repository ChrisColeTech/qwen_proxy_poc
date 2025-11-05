-- Migration v5: Server Settings Infrastructure
-- Add indexes and seed default server settings

-- Create index on settings table key for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default server settings if they don't exist
INSERT OR IGNORE INTO settings (key, value, created_at, updated_at)
VALUES
  ('server.port', '8000', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('server.host', '0.0.0.0', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('server.timeout', '120000', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('logging.level', 'info', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('logging.logRequests', 'true', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('logging.logResponses', 'true', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('system.autoStart', 'false', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('system.minimizeToTray', 'true', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000),
  ('system.checkUpdates', 'true', strftime('%s', 'now') * 1000, strftime('%s', 'now') * 1000);
