-- Ziyaretci tablosu
CREATE TABLE IF NOT EXISTS visitors (
  id SERIAL PRIMARY KEY,
  ip TEXT,
  country TEXT,
  city TEXT,
  user_agent TEXT,
  page TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE visitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Full access visitors" ON visitors FOR ALL USING (true) WITH CHECK (true);

-- Index
CREATE INDEX IF NOT EXISTS idx_visitors_created_at ON visitors(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_visitors_ip ON visitors(ip);
