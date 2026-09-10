ALTER TABLE jobs ADD COLUMN IF NOT EXISTS max_attempts INT NOT NULL DEFAULT 5;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS next_run_at TIMESTAMPTZ NOT NULL DEFAULT now();
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locked_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS locked_by TEXT;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS last_error TEXT;
CREATE INDEX IF NOT EXISTS idx_jobs_claim ON jobs(status, next_run_at, created_at);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id, revoked_at, expires_at);
CREATE INDEX IF NOT EXISTS idx_signals_org_occurred ON signals(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_attribution_touchpoint ON attribution_events(organization_id, touchpoint_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_org_created ON ai_decision_audits(organization_id, created_at DESC);

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'campaign_budget_nonnegative') THEN
    ALTER TABLE campaigns ADD CONSTRAINT campaign_budget_nonnegative CHECK (budget >= 0 AND spent >= 0);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'account_scores_range') THEN
    ALTER TABLE accounts ADD CONSTRAINT account_scores_range CHECK (intent_score BETWEEN 0 AND 100 AND physical_intervention_score BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'contact_score_range') THEN
    ALTER TABLE contacts ADD CONSTRAINT contact_score_range CHECK (intent_score BETWEEN 0 AND 100);
  END IF;
END $$;
