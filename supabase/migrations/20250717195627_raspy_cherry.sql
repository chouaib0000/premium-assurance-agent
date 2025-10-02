/*
  # Update RLS policies for public access

  1. Security Changes
    - Allow anonymous users to insert clients
    - Allow anonymous users to read clients (for admin panel)
    - Allow anonymous users to insert activity logs
    - Keep existing authenticated user policies

  2. Notes
    - This enables public access to the client form
    - Admin panel still requires authentication
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can read clients" ON clients;
DROP POLICY IF EXISTS "Anyone can insert clients" ON clients;
DROP POLICY IF EXISTS "Anyone can update clients" ON clients;
DROP POLICY IF EXISTS "Anyone can delete clients" ON clients;
DROP POLICY IF EXISTS "Anyone can read activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Anyone can insert activity logs" ON activity_logs;

-- Create new policies that allow public access
CREATE POLICY "Public can read clients"
  ON clients
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert clients"
  ON clients
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Authenticated can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for activity_logs table
CREATE POLICY "Public can read activity logs"
  ON activity_logs
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Public can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO public
  WITH CHECK (true);