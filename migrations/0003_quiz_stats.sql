-- scoresテーブルにクイズモード対応カラムを追加
ALTER TABLE scores ADD COLUMN mode TEXT NOT NULL DEFAULT 'ranking';
ALTER TABLE scores ADD COLUMN question_field TEXT;
ALTER TABLE scores ADD COLUMN answer_field TEXT;
ALTER TABLE scores ADD COLUMN is_multiple_choice INTEGER DEFAULT 0;
ALTER TABLE scores ADD COLUMN filter_json TEXT;

-- score_detailsに各問題の解答時間を追加
ALTER TABLE score_details ADD COLUMN time_ms INTEGER DEFAULT 0;

-- キャラ別統計用インデックス
CREATE INDEX idx_score_details_idol ON score_details(idol_name);
