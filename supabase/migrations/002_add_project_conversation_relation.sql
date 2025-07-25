-- Migration: Add relationship between projects and conversations
-- This allows organizing conversations within projects

-- Add project_id column to conversations table
ALTER TABLE conversations 
ADD COLUMN project_id UUID REFERENCES projects(id) ON DELETE SET NULL;

-- Add index for project_id
CREATE INDEX idx_conversations_project_id ON conversations(project_id);

-- Update RLS policies to include project-based access
-- Allow users to see conversations in their projects
CREATE POLICY "Users can view conversations in their projects" ON conversations
  FOR SELECT USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = conversations.project_id
    )
  );

-- Allow users to update conversations in their projects
CREATE POLICY "Users can update conversations in their projects" ON conversations
  FOR UPDATE USING (
    auth.uid() = user_id OR
    auth.uid() IN (
      SELECT user_id FROM projects WHERE id = conversations.project_id
    )
  );

-- Create a view for conversations with project information
CREATE OR REPLACE VIEW conversations_with_projects AS
SELECT 
  c.*,
  p.name as project_name,
  p.description as project_description,
  p.color as project_color
FROM conversations c
LEFT JOIN projects p ON c.project_id = p.id;

-- Grant access to the view
GRANT SELECT ON conversations_with_projects TO authenticated;

-- Add comment to document the relationship
COMMENT ON COLUMN conversations.project_id IS 'Optional reference to a project for organizing conversations';