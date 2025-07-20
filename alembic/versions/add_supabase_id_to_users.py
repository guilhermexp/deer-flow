"""add supabase_id to users table

Revision ID: add_supabase_id_001
Revises: 
Create Date: 2025-07-17

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'add_supabase_id_001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Add supabase_id column to users table
    op.add_column('users', sa.Column('supabase_id', sa.String(), nullable=True))
    # Create unique index for supabase_id
    op.create_index('idx_users_supabase_id', 'users', ['supabase_id'], unique=True)


def downgrade():
    # Drop index first
    op.drop_index('idx_users_supabase_id', table_name='users')
    # Drop column
    op.drop_column('users', 'supabase_id')