/*
  # Create diagrams schema

  1. New Tables
    - `diagrams`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
      - `name` (text)
      - `data` (jsonb) - Stores the diagram state
      - `owner_id` (uuid) - References auth.users
      - `is_public` (boolean)
      - `share_id` (uuid) - Unique identifier for sharing

  2. Security
    - Enable RLS on `diagrams` table
    - Add policies for:
      - Owner can do all operations
      - Public diagrams can be viewed by anyone
      - Shared diagrams can be viewed by anyone with the share_id
*/

CREATE TABLE diagrams (
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