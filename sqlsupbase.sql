/*
  # Add role column to user_accounts table

  This migration adds the missing 'role' column to user_accounts table
  which is required for the Lead Management and Messaging System to work.

  1. Changes to user_accounts table:
    - Add 'role' column with default 'agent'
    - Add check constraint for valid roles (admin, agent)
    - Add index on role column for performance

  2. Security:
    - Enable RLS on leads and messages tables if not already enabled
    - Add policies for full access (can be refined later)
*/

-- Add role column to user_accounts if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'role'
  ) THEN
    ALTER TABLE user_accounts
    ADD COLUMN role text NOT NULL DEFAULT 'agent'
    CHECK (role IN ('admin', 'agent'));

    -- Add index on role column
    CREATE INDEX idx_user_accounts_role ON user_accounts(role);

    -- Set existing admin user to admin role (assuming username 'admin')
    UPDATE user_accounts
    SET role = 'admin'
    WHERE username = 'admin' OR created_by = 'admin' AND username LIKE '%admin%';

  END IF;
END $$;

-- Enable RLS on leads table if not already enabled
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow all operations on leads" ON leads;
CREATE POLICY "Allow all operations on leads"
  ON leads FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Enable RLS on messages table if not already enabled
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
CREATE POLICY "Allow all operations on messages"
  ON messages FOR ALL
  TO public
  USING (true)
  WITH CHECK (true);

-- Verify the changes
SELECT
  'user_accounts' as table_name,
  COUNT(*) as total_users,
  COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
  COUNT(CASE WHEN role = 'agent' THEN 1 END) as agent_count
FROM user_accounts;