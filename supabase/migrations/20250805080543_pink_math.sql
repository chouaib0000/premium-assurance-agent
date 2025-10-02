/*
  # Add audio files support to scheduled calls

  1. Changes
    - Add `audio_files` column to scheduled_calls table as jsonb type
    - This will store audio recordings and uploaded audio files

  2. Security
    - No changes to RLS policies needed
    - Audio files are stored as base64 data within the jsonb column
*/

-- Add audio_files column to scheduled_calls table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'scheduled_calls' AND column_name = 'audio_files'
  ) THEN
    ALTER TABLE scheduled_calls ADD COLUMN audio_files jsonb DEFAULT '[]'::jsonb;
  END IF;
END $$;

-- Create index for better performance on audio files
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_audio_files ON scheduled_calls USING GIN(audio_files);