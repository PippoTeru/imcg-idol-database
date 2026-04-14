CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nickname TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE scores (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  course TEXT NOT NULL,
  time_ms INTEGER NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  played_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_scores_course_time ON scores(course, time_ms);
CREATE INDEX idx_scores_user ON scores(user_id, played_at DESC);
