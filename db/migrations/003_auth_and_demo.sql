-- Production auth hardening: an email identifies exactly one login account.
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_global ON users (lower(email));

-- Explicitly document allowed application roles at the database boundary.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_role_allowed') THEN
    ALTER TABLE users ADD CONSTRAINT users_role_allowed CHECK (role IN ('owner','admin','operator','viewer'));
  END IF;
END $$;
