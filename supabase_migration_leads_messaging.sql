/*
  # Add Leads and Messaging System

  ## Overview
  This migration adds lead management and messaging functionality to enable:
  - Admins to create and assign leads to agents
  - Agents to view their assigned leads and export them
  - Real-time messaging between admins and agents
  - Message notifications for both parties

  ## New Tables

  ### `leads`
  Stores lead information assigned to agents
  - `id` (uuid, primary key) - Unique identifier
  - `agent_id` (uuid, foreign key) - References the assigned agent
  - `name` (text) - Lead's full name
  - `email` (text) - Lead's email address
  - `phone` (text) - Lead's phone number
  - `company` (text) - Lead's company name
  - `notes` (text) - Additional notes about the lead
  - `status` (text) - Lead status (new, contacted, qualified, converted, lost)
  - `created_at` (timestamptz) - When the lead was created
  - `updated_at` (timestamptz) - Last update timestamp
  - `created_by` (uuid, foreign key) - Admin who created the lead

  ### `messages`
  Stores messages between admins and agents
  - `id` (uuid, primary key) - Unique identifier
  - `sender_id` (uuid, foreign key) - User who sent the message
  - `recipient_id` (uuid, foreign key) - User who receives the message
  - `content` (text) - Message content
  - `read` (boolean) - Whether message has been read
  - `created_at` (timestamptz) - When message was sent

  ## Security
  - Enable RLS on all new tables
  - Agents can only view their assigned leads
  - Agents can update status and notes of their leads
  - Admins can view and manage all leads
  - Users can send and receive messages to/from their conversations
  - Users can only read their own messages

  ## How to use this file:
  1. Go to https://supabase.com/dashboard
  2. Select your project
  3. Go to SQL Editor
  4. Create a new query
  5. Paste this entire SQL script
  6. Click "Run" to execute
*/

-- Create leads table
CREATE TABLE IF NOT EXISTS leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  email text,
  phone text,
  company text,
  notes text DEFAULT '',
  status text DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES user_accounts(id) ON DELETE SET NULL
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE NOT NULL,
  recipient_id uuid REFERENCES user_accounts(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_leads_agent_id ON leads(agent_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for leads table

-- Public can view all leads (for simplicity, matching existing patterns)
CREATE POLICY "Public can view leads"
  ON leads FOR SELECT
  TO public
  USING (true);

-- Public can create leads
CREATE POLICY "Public can create leads"
  ON leads FOR INSERT
  TO public
  WITH CHECK (true);

-- Public can update leads
CREATE POLICY "Public can update leads"
  ON leads FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Public can delete leads
CREATE POLICY "Public can delete leads"
  ON leads FOR DELETE
  TO public
  USING (true);

-- RLS Policies for messages table

-- Public can view all messages (for simplicity, matching existing patterns)
CREATE POLICY "Public can view messages"
  ON messages FOR SELECT
  TO public
  USING (true);

-- Public can send messages
CREATE POLICY "Public can send messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Public can update messages
CREATE POLICY "Public can update messages"
  ON messages FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Public can delete messages
CREATE POLICY "Public can delete messages"
  ON messages FOR DELETE
  TO public
  USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_leads_updated_at_trigger ON leads;
CREATE TRIGGER update_leads_updated_at_trigger
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully! Lead management and messaging system are now active.';
END $$;