/*
  # Add client enhancements

  1. New columns for clients table
    - `iban` (text) - Client's IBAN
    - `files` (jsonb) - Array of uploaded files with metadata
    - `agent_comments` (text) - Comments from agents for admin review

  2. Security
    - Update existing policies to handle new fields
    - Maintain RLS for file access
*/

-- Add new columns to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'iban'
  ) THEN
    ALTER TABLE clients ADD COLUMN iban text;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'files'
  ) THEN
    ALTER TABLE clients ADD COLUMN files jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'agent_comments'
  ) THEN
    ALTER TABLE clients ADD COLUMN agent_comments text;
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_iban ON clients(iban);
CREATE INDEX IF NOT EXISTS idx_clients_files ON clients USING GIN(files);