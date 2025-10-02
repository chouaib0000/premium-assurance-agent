/*
  # Add numero_securite_sociale column to clients table

  1. Changes
    - Add `numero_securite_sociale` column to clients table as text type
    - Make it nullable since existing records won't have this field

  2. Security
    - No changes to RLS policies needed
*/

-- Add numero_securite_sociale column to clients table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'numero_securite_sociale'
  ) THEN
    ALTER TABLE clients ADD COLUMN numero_securite_sociale text;
  END IF;
END $$;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_clients_numero_securite_sociale ON clients(numero_securite_sociale);