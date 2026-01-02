import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const db = new Database(join(__dirname, 'lm-trace-review.db'));

// Enable foreign keys
db.pragma('foreign_keys = ON');

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS datasets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lastUpdated TEXT NOT NULL,
    traceCount INTEGER DEFAULT 0,
    commentCount INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS traces (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    trace_id TEXT NOT NULL,
    date TEXT,
    time TEXT,
    input TEXT,
    message TEXT,
    tool_called TEXT,
    query_validity TEXT,
    identified_entities TEXT,
    trace_tags TEXT,
    latency TEXT,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    dataset_id INTEGER NOT NULL,
    trace_id TEXT NOT NULL,
    author_display_name TEXT,
    author_email TEXT,
    comment TEXT,
    tags TEXT,
    highlight_text TEXT,
    highlight_offset_start INTEGER,
    highlight_offset_end INTEGER,
    highlight_source TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS config (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_traces_dataset ON traces(dataset_id);
  CREATE INDEX IF NOT EXISTS idx_traces_trace_id ON traces(trace_id);
  CREATE INDEX IF NOT EXISTS idx_comments_dataset ON comments(dataset_id);
  CREATE INDEX IF NOT EXISTS idx_comments_trace_id ON comments(trace_id);
`);

// Add latency column if it doesn't exist (migration)
try {
  const tableInfo = db.prepare("PRAGMA table_info(traces)").all();
  const hasLatency = tableInfo.some(col => col.name === 'latency');

  if (!hasLatency) {
    console.log('Adding latency column to traces table...');
    db.exec('ALTER TABLE traces ADD COLUMN latency TEXT');
    console.log('Latency column added successfully');
  }
} catch (error) {
  console.error('Error adding latency column:', error);
}

export default db;
