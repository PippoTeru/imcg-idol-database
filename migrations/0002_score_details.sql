CREATE TABLE score_details (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  score_id INTEGER NOT NULL REFERENCES scores(id),
  question_idx INTEGER NOT NULL,
  idol_name TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX idx_score_details_score ON score_details(score_id);
