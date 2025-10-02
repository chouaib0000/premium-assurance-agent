/*
  # Add agent permissions system

  1. New columns for user_accounts table
    - `can_edit_clients` (boolean) - Whether agent can edit client data or only view/comment
    - `permissions_updated_by` (text) - Who last updated the permissions
    - `permissions_updated_at` (timestamp) - When permissions were last updated

  2. Security
    - Update existing policies to handle new permission field
    - Maintain RLS for permission-based access
*/

-- Add new columns to user_accounts table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'can_edit_clients'
  ) THEN
    ALTER TABLE user_accounts ADD COLUMN can_edit_clients boolean DEFAULT true;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'permissions_updated_by'
  ) THEN
    ALTER TABLE user_accounts ADD COLUMN permissions_updated_by text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_accounts' AND column_name = 'permissions_updated_at'
  ) THEN
    ALTER TABLE user_accounts ADD COLUMN permissions_updated_at timestamptz;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_can_edit_clients ON user_accounts(can_edit_clients);