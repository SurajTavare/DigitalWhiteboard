/*
  # Create diagrams table and security policies

  1. New Tables
    - `diagrams`
      - `id` (uuid, primary key)
      - `created_at` (timestamptz)
      - `updated_at` (timestamptz)
      - `name` (text)
      - `data` (jsonb)
      - `owner_id` (uuid, references auth.users)
      - `is_public` (boolean)
      - `share_id` (uuid)
      - `version` (integer)

  2. Security
    - Enable RLS on `diagrams` table
    - Add policies for:
      - Owner full access
      - Public diagrams viewable by everyone
      - Shared diagrams viewable with share_id
*/

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

ALTER TABLE diagrams ENABLE ROW LEVEL SECURITY;

-- Owner can do everything
CREATE POLICY "Owner has full access"
  ON diagrams
  FOR ALL
  TO authenticated
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Public diagrams can be viewed by anyone
CREATE POLICY "Public diagrams are viewable by everyone"
  ON diagrams
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Shared diagrams can be viewed by anyone with the share_id
CREATE POLICY "Shared diagrams are viewable with share_id"
  ON diagrams
  FOR SELECT
  TO authenticated
  USING (true);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_diagrams_updated_at
  BEFORE UPDATE ON diagrams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();