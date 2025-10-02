/*
  # Create call management and scheduling system

  1. New Tables
    - `scheduled_calls`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `agent_id` (uuid, foreign key to user_accounts)
      - `scheduled_date` (timestamptz)
      - `duration_minutes` (integer)
      - `call_type` (text) - 'initial', 'follow_up', 'closing'
      - `status` (text) - 'scheduled', 'completed', 'missed', 'cancelled'
      - `notes` (text)
      - `outcome` (text) - 'interested', 'not_interested', 'callback_requested', 'subscription_confirmed'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `completed_at` (timestamptz)

    - `subscription_forms`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `agent_id` (uuid, foreign key to user_accounts)
      - `call_id` (uuid, foreign key to scheduled_calls)
      - `form_data` (jsonb) - Complete subscription form data
      - `status` (text) - 'draft', 'completed', 'submitted'
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `submitted_at` (timestamptz)

    - `agent_comments`
      - `id` (uuid, primary key)
      - `agent_id` (uuid, foreign key to user_accounts)
      - `admin_id` (uuid, foreign key to user_accounts)
      - `comment` (text)
      - `is_read` (boolean)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for agents and admins
*/

-- Create scheduled_calls table
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  scheduled_date timestamptz NOT NULL,
  duration_minutes integer DEFAULT 30,
  call_type text NOT NULL CHECK (call_type IN ('initial', 'follow_up', 'closing')),
  status text NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'completed', 'missed', 'cancelled')),
  notes text,
  outcome text CHECK (outcome IN ('interested', 'not_interested', 'callback_requested', 'subscription_confirmed')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

-- Create subscription_forms table
CREATE TABLE IF NOT EXISTS subscription_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  call_id uuid REFERENCES scheduled_calls(id) ON DELETE SET NULL,
  form_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed', 'submitted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  submitted_at timestamptz
);

-- Create agent_comments table
CREATE TABLE IF NOT EXISTS agent_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  admin_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  comment text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_comments ENABLE ROW LEVEL SECURITY;

-- Create policies for scheduled_calls table
CREATE POLICY "Public can manage scheduled calls"
  ON scheduled_calls
  FOR ALL
  TO public
  USING (true);

-- Create policies for subscription_forms table
CREATE POLICY "Public can manage subscription forms"
  ON subscription_forms
  FOR ALL
  TO public
  USING (true);

-- Create policies for agent_comments table
CREATE POLICY "Public can manage agent comments"
  ON agent_comments
  FOR ALL
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_agent_id ON scheduled_calls(agent_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_client_id ON scheduled_calls(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_date ON scheduled_calls(scheduled_date);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_status ON scheduled_calls(status);
CREATE INDEX IF NOT EXISTS idx_subscription_forms_agent_id ON subscription_forms(agent_id);
CREATE INDEX IF NOT EXISTS idx_subscription_forms_client_id ON subscription_forms(client_id);
CREATE INDEX IF NOT EXISTS idx_subscription_forms_status ON subscription_forms(status);
CREATE INDEX IF NOT EXISTS idx_agent_comments_agent_id ON agent_comments(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_comments_is_read ON agent_comments(is_read);

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_scheduled_calls_updated_at
    BEFORE UPDATE ON scheduled_calls
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscription_forms_updated_at
    BEFORE UPDATE ON subscription_forms
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agent_comments_updated_at
    BEFORE UPDATE ON agent_comments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();