-- ============================================================
-- Migration 01 – Settlement & Resolution Features (2026-06-10)
-- Run this file after 00_database_schema.sql is applied.
-- ============================================================

-- 1. Add resolution tracking columns to trp_infm
ALTER TABLE trp_infm ADD COLUMN IF NOT EXISTS is_resolved   BOOLEAN   DEFAULT FALSE;
ALTER TABLE trp_infm ADD COLUMN IF NOT EXISTS resolved_at   TIMESTAMP;
ALTER TABLE trp_infm ADD COLUMN IF NOT EXISTS resolved_by   INTEGER REFERENCES user_infm(id) ON DELETE SET NULL;

-- 2. Settlement action log
--    Each row captures one user action (resolve trip, clear member receipt, or an undo).
--    affected_members stores a snapshot: [{member_id, member_name, amount_added, paid_before, paid_after}]
CREATE TABLE IF NOT EXISTS settlement_log (
  id                  SERIAL PRIMARY KEY,
  action_type         VARCHAR(50) NOT NULL,
  -- 'RESOLVE_TRIP'      – trip resolved, per-member cost added to their paid
  -- 'CLEAR_MEMBER'      – member's full unpaid balance added to their paid
  -- 'UNDO_RESOLVE_TRIP' – undid a RESOLVE_TRIP entry
  -- 'UNDO_CLEAR_MEMBER' – undid a CLEAR_MEMBER entry
  group_id            INTEGER NOT NULL REFERENCES grp_infm(id) ON DELETE CASCADE,
  trip_id             INTEGER REFERENCES trp_infm(id) ON DELETE SET NULL,
  member_id           INTEGER REFERENCES member_infm(id) ON DELETE SET NULL,
  excluded_member_ids JSONB    NOT NULL DEFAULT '[]',
  affected_members    JSONB    NOT NULL DEFAULT '[]',
  performed_by        INTEGER REFERENCES user_infm(id) ON DELETE SET NULL,
  undo_of_log_id      INTEGER REFERENCES settlement_log(id),
  is_undone           BOOLEAN  NOT NULL DEFAULT FALSE,
  created_at          TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settlement_log_group_id  ON settlement_log(group_id);
CREATE INDEX IF NOT EXISTS idx_settlement_log_trip_id   ON settlement_log(trip_id);
CREATE INDEX IF NOT EXISTS idx_settlement_log_member_id ON settlement_log(member_id);
