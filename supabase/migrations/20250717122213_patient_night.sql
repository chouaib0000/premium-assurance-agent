/*
  # Create clients and activity logs tables

  1. New Tables
    - `clients`
      - `id` (uuid, primary key)
      - `nom` (text)
      - `prenom` (text)
      - `date_naissance` (date)
      - `adresse` (text)
      - `telephone` (text)
      - `conjoint` (jsonb, nullable)
      - `enfants` (jsonb, nullable)
      - `mutuelle_actuelle` (jsonb)
      - `nouvelle_adhesion` (jsonb)
      - `resiliation` (text)
      - `agent` (text)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
    
    - `activity_logs`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key)
      - `action` (text)
      - `details` (text)
      - `timestamp` (timestamp)
      - `user` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users to manage their data
*/

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nom text NOT NULL,
  prenom text NOT NULL,
  date_naissance date NOT NULL,
  adresse text NOT NULL,
  telephone text NOT NULL,
  conjoint jsonb,
  enfants jsonb,
  mutuelle_actuelle jsonb NOT NULL,
  nouvelle_adhesion jsonb NOT NULL,
  resiliation text NOT NULL CHECK (resiliation IN ('Cabinet', 'Compagnie')),
  agent text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  action text NOT NULL,
  details text NOT NULL,
  timestamp timestamptz NOT NULL,
  user_name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for clients table
CREATE POLICY "Anyone can read clients"
  ON clients
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert clients"
  ON clients
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can update clients"
  ON clients
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can delete clients"
  ON clients
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policies for activity_logs table
CREATE POLICY "Anyone can read activity logs"
  ON activity_logs
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Anyone can insert activity logs"
  ON activity_logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_clients_nom ON clients(nom);
CREATE INDEX IF NOT EXISTS idx_clients_prenom ON clients(prenom);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_logs_client_id ON activity_logs(client_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_timestamp ON activity_logs(timestamp);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();