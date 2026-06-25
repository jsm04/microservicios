CREATE TABLE IF NOT EXISTS users (
  id         UUID PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE,
  password   TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
