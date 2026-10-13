-- Esquema de referencia. El servidor aplica este mismo modelo automáticamente al iniciar.
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS visitors (
  visitor_id TEXT PRIMARY KEY,
  purchase_status TEXT NOT NULL DEFAULT 'prospect',
  first_visit INTEGER NOT NULL,
  last_visit INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS conversations (
  conversation_id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL REFERENCES visitors(visitor_id) ON DELETE CASCADE,
  conversation_history TEXT NOT NULL DEFAULT '[]',
  current_stage TEXT NOT NULL DEFAULT 'WELCOME',
  country TEXT,
  experience_level TEXT,
  business_status TEXT,
  main_goal TEXT,
  main_problem TEXT,
  modules_viewed INTEGER NOT NULL DEFAULT 0,
  testimonials_viewed INTEGER NOT NULL DEFAULT 0,
  official_bonuses_viewed INTEGER NOT NULL DEFAULT 0,
  special_bonuses_viewed INTEGER NOT NULL DEFAULT 0,
  price_viewed INTEGER NOT NULL DEFAULT 0,
  checkout_video_viewed INTEGER NOT NULL DEFAULT 0,
  checkout_shown INTEGER NOT NULL DEFAULT 0,
  purchase_intent TEXT NOT NULL DEFAULT 'NONE',
  knows_program INTEGER NOT NULL DEFAULT 0,
  last_assistant_question TEXT,
  pending_action TEXT,
  silenced INTEGER NOT NULL DEFAULT 0,
  last_processed_user_message_id TEXT,
  is_generating_response INTEGER NOT NULL DEFAULT 0,
  answered_experience_level INTEGER NOT NULL DEFAULT 0,
  answered_main_goal INTEGER NOT NULL DEFAULT 0,
  answered_country INTEGER NOT NULL DEFAULT 0,
  answered_business_status INTEGER NOT NULL DEFAULT 0,
  beginner_reassurance_shown INTEGER NOT NULL DEFAULT 0,
  detected_objection TEXT,
  conversation_status TEXT NOT NULL DEFAULT 'ACTIVE',
  guarantee_mentioned INTEGER NOT NULL DEFAULT 0,
  last_visit INTEGER NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS conversations_visitor_idx ON conversations(visitor_id, updated_at DESC);
CREATE TABLE IF NOT EXISTS processed_user_messages (
  message_id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL REFERENCES conversations(conversation_id) ON DELETE CASCADE,
  created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS country_prices (
  country TEXT PRIMARY KEY,
  currency TEXT NOT NULL,
  display_price TEXT NOT NULL,
  regular_price TEXT,
  offer_price TEXT,
  regular_price_display TEXT,
  offer_price_display TEXT,
  discount_percent_official INTEGER,
  promotion_active INTEGER NOT NULL DEFAULT 0,
  available_coupons INTEGER,
  supported_payment_methods TEXT NOT NULL DEFAULT '[]',
  enabled_payment_methods TEXT NOT NULL DEFAULT '[]',
  official INTEGER NOT NULL DEFAULT 0,
  excluded INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);
