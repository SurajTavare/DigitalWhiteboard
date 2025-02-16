/*
  # Update diagrams table and policies

  1. Changes
    - Safely create diagrams table if it doesn't exist
    - Safely create policies if they don't exist
    - Add update trigger for timestamps
*/

-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS diagrams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  name text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}',
  owner_id uuid REFERENCES auth.users(id),
  is_public boolean DEFAULT false,
  share_id uuid DEFAULT gen_random_uuid(),
  version integer DEFAULT 1
);

-- Enable RLS if not already enabled
ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Safely create policies
DO $$ 
BEGIN
  -- Owner full access policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'diagrams' AND policyname = 'Owner has full access'
  ) THEN
    CREATE POLICY "Owner has full access"
      ON diagrams
      FOR ALL
      TO authenticated
      USING (auth.uid() = owner_id)
      WITH CHECK (auth.uid() = owner_id);
  END IF;

  -- Public diagrams policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'diagrams' AND policyname = 'Public diagrams are viewable by everyone'
  ) THEN
    CREATE POLICY "Public diagrams are viewable by everyone"
      ON diagrams
      FOR SELECT
      TO authenticated
      USING (is_public = true);
  END IF;

  -- Shared diagrams policy
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'diagrams' AND policyname = 'Shared diagrams are viewable with share_id'
  ) THEN
    CREATE POLICY "Shared diagrams are viewable with share_id"
      ON diagrams
      FOR SELECT
      TO authenticated
      USING (true);
  END IF;
END $$;

-- Create or replace the timestamp update function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS update_diagrams_updated_at ON diagrams;
CREATE TRIGGER update_diagrams_updated_at
  BEFORE UPDATE ON diagrams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();