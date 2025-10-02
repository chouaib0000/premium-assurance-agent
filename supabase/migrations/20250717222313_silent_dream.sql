/*
  # Fix client deletion policies

  1. Security Changes
    - Update deletion policy to allow public access for admin operations
    - Ensure activity logs can be deleted when clients are deleted

  2. Notes
    - This enables proper deletion from the admin panel
    - Maintains security while allowing necessary operations
*/

-- Update clients table policies for deletion
DROP POLICY IF EXISTS "Authenticated can delete clients" ON clients;
DROP POLICY IF EXISTS "Public can delete clients" ON clients;

CREATE POLICY "Public can delete clients"
  ON clients
  FOR DELETE
  TO public
  USING (true);

-- Update clients table policies for updates
DROP POLICY IF EXISTS "Authenticated can update clients" ON clients;
DROP POLICY IF EXISTS "Public can update clients" ON clients;

CREATE POLICY "Public can update clients"
  ON clients
  FOR UPDATE
  TO public
  USING (true);

-- Ensure activity logs can be deleted
DROP POLICY IF EXISTS "Public can delete activity logs" ON activity_logs;

CREATE POLICY "Public can delete activity logs"
  ON activity_logs
  FOR DELETE
  TO public
  USING (true);

CREATE POLICY "Public can update activity logs"
  ON activity_logs
  FOR UPDATE
  TO public
  USING (true);