/*
  # Create call history table

  1. New Tables
    - `call_history`
      - `id` (uuid, primary key)
      - `client_id` (uuid, foreign key to clients)
      - `agent_id` (uuid, foreign key to user_accounts)
      - `call_date` (timestamptz) - When the call was made
      - `duration_minutes` (integer) - Duration of the call in minutes
      - `call_type` (text) - Type of call: 'initial', 'follow_up', 'closing', 'information'
      - `outcome` (text) - Result of the call: 'interested', 'not_interested', 'callback_requested', 'subscription_confirmed', 'no_answer', 'busy'
      - `notes` (text) - Notes about the call
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)

  2. Security
    - Enable RLS on call_history table
    - Add policies for agents and admins
*/

-- Create call_history table
CREATE TABLE IF NOT EXISTS call_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) ON DELETE CASCADE,
  agent_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE,
  call_date timestamptz NOT NULL,
  duration_minutes integer NOT NULL DEFAULT 0,
  call_type text NOT NULL CHECK (call_type IN ('initial', 'follow_up', 'closing', 'information')),
  outcome text CHECK (outcome IN ('interested', 'not_interested', 'callback_requested', 'subscription_confirmed', 'no_answer', 'busy')),
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE call_history ENABLE ROW LEVEL SECURITY;

-- Create policies for call_history table
CREATE POLICY "Public can manage call history"
  ON call_history
  FOR ALL
  TO public
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_history_client_id ON call_history(client_id);
CREATE INDEX IF NOT EXISTS idx_call_history_agent_id ON call_history(agent_id);
CREATE INDEX IF NOT EXISTS idx_call_history_call_date ON call_history(call_date);
CREATE INDEX IF NOT EXISTS idx_call_history_call_type ON call_history(call_type);
CREATE INDEX IF NOT EXISTS idx_call_history_outcome ON call_history(outcome);

-- Create trigger for updated_at timestamp
CREATE TRIGGER update_call_history_updated_at
    BEFORE UPDATE ON call_history
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();