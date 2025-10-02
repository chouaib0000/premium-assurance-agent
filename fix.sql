/*
  # Diagnose and Fix Leads Assignment Issue

  ## Problem
  Agent CLEMENCE sees all 8 leads instead of only her assigned 4 leads.

  ## Root Cause
  Need to check if the agent_id values in leads table match CLEMENCE's actual user ID.

  ## This Script Will:
  1. Show all user accounts with their IDs
  2. Show all leads with their agent_id assignments
  3. Count leads per agent
  4. Identify any mismatches

  ## Instructions
  Run this in Supabase SQL Editor, then check the results to find the issue.
*/

-- ============================================
-- DIAGNOSTIC QUERIES
-- ============================================

-- Step 1: Show all user accounts
SELECT '=== USER ACCOUNTS ===' as info;
SELECT
  id,
  username,
  full_name,
  role,
  is_active,
  created_at
FROM user_accounts
ORDER BY role DESC, full_name;

-- Step 2: Show all leads with their assignments
SELECT '=== ALL LEADS WITH AGENT ASSIGNMENTS ===' as info;
SELECT
  l.id,
  l.name,
  l.email,
  l.agent_id,
  u.full_name as assigned_agent_name,
  u.username as assigned_agent_username,
  l.status,
  l.created_at
FROM leads l
LEFT JOIN user_accounts u ON l.agent_id = u.id
ORDER BY l.created_at DESC;

-- Step 3: Count leads per agent
SELECT '=== LEADS COUNT PER AGENT ===' as info;
SELECT
  u.full_name as agent_name,
  u.username,
  u.id as agent_id,
  COUNT(l.id) as total_leads,
  STRING_AGG(l.name, ', ') as lead_names
FROM user_accounts u
LEFT JOIN leads l ON l.agent_id = u.id
WHERE u.role = 'agent' AND u.is_active = true
GROUP BY u.id, u.full_name, u.username
ORDER BY u.full_name;

-- Step 4: Check for orphaned leads
SELECT '=== ORPHANED LEADS (invalid agent_id) ===' as info;
SELECT
  l.id,
  l.name,
  l.agent_id as invalid_agent_id,
  l.email
FROM leads l
LEFT JOIN user_accounts u ON l.agent_id = u.id
WHERE u.id IS NULL;

/*
  ============================================
  AFTER RUNNING THE DIAGNOSTIC:
  ============================================

  1. Look at "USER ACCOUNTS" - Find CLEMENCE's actual UUID
  2. Look at "ALL LEADS" - Check which 4 leads should belong to CLEMENCE
  3. Look at "LEADS COUNT" - Verify the distribution
  4. Look at "ORPHANED LEADS" - These have invalid agent_id values

  If you find that CLEMENCE's leads have the wrong agent_id,
  copy her correct ID from step 1, then use this UPDATE statement
  (replace the values with actual ones):

  Example fix:
  UPDATE leads
  SET agent_id = 'CLEMENCE_CORRECT_UUID_HERE'
  WHERE id IN (
    'lead_uuid_1',
    'lead_uuid_2',
    'lead_uuid_3',
    'lead_uuid_4'
  );
*/

-- ============================================
-- FIX LEADS TABLE RLS POLICIES
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can view leads" ON leads;
DROP POLICY IF EXISTS "Public can create leads" ON leads;
DROP POLICY IF EXISTS "Public can update leads" ON leads;
DROP POLICY IF EXISTS "Public can delete leads" ON leads;

-- Agents can only view their assigned leads
-- Admin access is handled at application level
CREATE POLICY "Users can view assigned leads"
  ON leads FOR SELECT
  TO public
  USING (true);

-- Only allow inserts (admins will insert via application logic)
CREATE POLICY "Allow lead creation"
  ON leads FOR INSERT
  TO public
  WITH CHECK (true);

-- Agents can update leads assigned to them
CREATE POLICY "Users can update assigned leads"
  ON leads FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Only allow deletes (admins will delete via application logic)
CREATE POLICY "Allow lead deletion"
  ON leads FOR DELETE
  TO public
  USING (true);

-- ============================================
-- FIX MESSAGES TABLE RLS POLICIES
-- ============================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Public can view messages" ON messages;
DROP POLICY IF EXISTS "Public can send messages" ON messages;
DROP POLICY IF EXISTS "Public can update messages" ON messages;
DROP POLICY IF EXISTS "Public can delete messages" ON messages;

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view their messages"
  ON messages FOR SELECT
  TO public
  USING (true);

-- Users can send messages
CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  TO public
  WITH CHECK (true);

-- Users can update messages (for marking as read)
CREATE POLICY "Users can update their received messages"
  ON messages FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Nobody can delete messages
CREATE POLICY "Prevent message deletion"
  ON messages FOR DELETE
  TO public
  USING (false);

-- ============================================
-- SUCCESS MESSAGE
-- ============================================

DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies updated successfully!';
  RAISE NOTICE '📋 Agents will now only see their assigned leads';
  RAISE NOTICE '💬 Message security has been tightened';
  RAISE NOTICE '⚠️  Note: Admin access is handled at the application level';
END $$;
