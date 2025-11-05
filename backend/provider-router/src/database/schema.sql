-- Settings table: stores key-value configuration
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL DEFAULT (strftime('%s', 'now'))
);

-- Metadata table: stores schema version and other metadata
CREATE TABLE IF NOT EXISTS metadata (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Sessions table: stores conversation sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,                    -- MD5 hash of first user message
    chat_id TEXT NOT NULL,                  -- Qwen chat ID
    parent_id TEXT,                         -- Current parent_id for next message
    first_user_message TEXT NOT NULL,       -- First message for reference
    message_count INTEGER DEFAULT 0,        -- Number of messages in conversation
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    last_accessed INTEGER NOT NULL,         -- Timestamp (milliseconds)
    expires_at INTEGER NOT NULL             -- Timestamp (milliseconds)
);

-- Sessions indexes
CREATE INDEX IF NOT EXISTS idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_chat_id ON sessions(chat_id);
CREATE INDEX IF NOT EXISTS idx_sessions_created_at ON sessions(created_at);

-- Requests table: stores API requests
CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,               -- Foreign key to sessions
    request_id TEXT NOT NULL UNIQUE,        -- UUID for request tracking
    timestamp INTEGER NOT NULL,             -- Timestamp (milliseconds)
    method TEXT NOT NULL,                   -- HTTP method (POST)
    path TEXT NOT NULL,                     -- Endpoint path
    openai_request TEXT NOT NULL,           -- Full OpenAI request body (JSON)
    qwen_request TEXT NOT NULL,             -- Transformed Qwen payload (JSON)
    model TEXT NOT NULL,                    -- Model name (e.g., qwen3-max)
    stream BOOLEAN NOT NULL,                -- Streaming flag
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Requests indexes
CREATE INDEX IF NOT EXISTS idx_requests_session_id ON requests(session_id);
CREATE INDEX IF NOT EXISTS idx_requests_timestamp ON requests(timestamp);
CREATE INDEX IF NOT EXISTS idx_requests_request_id ON requests(request_id);
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests(created_at);

-- Responses table: stores API responses
CREATE TABLE IF NOT EXISTS responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,            -- Foreign key to requests
    session_id TEXT NOT NULL,               -- Foreign key to sessions
    response_id TEXT NOT NULL UNIQUE,       -- UUID for response tracking
    timestamp INTEGER NOT NULL,             -- Timestamp (milliseconds)
    qwen_response TEXT,                     -- Raw Qwen response (JSON, can be null for streaming)
    openai_response TEXT,                   -- Transformed OpenAI response (JSON)
    parent_id TEXT,                         -- New parent_id from response
    completion_tokens INTEGER,              -- Token usage
    prompt_tokens INTEGER,                  -- Token usage
    total_tokens INTEGER,                   -- Token usage
    finish_reason TEXT,                     -- stop, length, error, etc.
    error TEXT,                             -- Error message if failed
    duration_ms INTEGER,                    -- Response time in milliseconds
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    FOREIGN KEY (request_id) REFERENCES requests(id) ON DELETE CASCADE,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

-- Responses indexes
CREATE INDEX IF NOT EXISTS idx_responses_request_id ON responses(request_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_response_id ON responses(response_id);
CREATE INDEX IF NOT EXISTS idx_responses_timestamp ON responses(timestamp);
CREATE INDEX IF NOT EXISTS idx_responses_created_at ON responses(created_at);

-- Qwen API Credentials table: stores Qwen authentication credentials
CREATE TABLE IF NOT EXISTS qwen_credentials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    token TEXT NOT NULL,                    -- bx-umidtoken value
    cookies TEXT NOT NULL,                  -- Cookie header value
    expires_at INTEGER,                     -- Optional expiry timestamp (milliseconds)
    created_at INTEGER NOT NULL,            -- Timestamp (milliseconds)
    updated_at INTEGER NOT NULL             -- Timestamp (milliseconds)
);

-- Qwen credentials index
CREATE INDEX IF NOT EXISTS idx_qwen_credentials_expires ON qwen_credentials(expires_at);

-- Insert initial schema version
INSERT OR IGNORE INTO metadata (key, value, updated_at)
VALUES ('schema_version', '2', strftime('%s', 'now') * 1000);

-- Initialize default settings
INSERT OR IGNORE INTO settings (key, value) VALUES ('active_provider', 'lm-studio');
