-- ============================================================
-- Migration 02 – Per-member settlement tracking (2026-06-15)
-- Run this file after 01_add_settlement_features.sql is applied.
-- Safe to re-run: all statements use IF NOT EXISTS / DO $$ guards.
-- ============================================================

-- 1. Add settled_member_ids array to trp_infm
--    Stores the IDs of members who have already settled their
--    individual share of this trip expense.
ALTER TABLE trp_infm ADD COLUMN IF NOT EXISTS settled_member_ids JSONB NOT NULL DEFAULT '[]';

-- 2. Add index for efficient lookups on settled state
CREATE INDEX IF NOT EXISTS idx_trp_infm_settled_member_ids ON trp_infm USING GIN (settled_member_ids);

-- 3. Extend settlement_log action_type for partial settlements
--    Existing allowed values documented in migration 01:
--      'RESOLVE_TRIP', 'CLEAR_MEMBER', 'UNDO_RESOLVE_TRIP', 'UNDO_CLEAR_MEMBER'
--    New values added by this feature:
--      'SETTLE_TRIP_MEMBER'      – one member settled their share of a trip
--      'UNDO_SETTLE_TRIP_MEMBER' – undid a SETTLE_TRIP_MEMBER entry
--    (No schema change needed – action_type is varchar(50), values are free-form)
