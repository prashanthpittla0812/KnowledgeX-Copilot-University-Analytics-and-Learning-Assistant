"""Add file_url column to learning_materials

Revision ID: a1b2c3d4e5f6
Revises: 84e743168b53
Create Date: 2026-06-07 15:20:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = 'a1b2c3d4e5f6'
down_revision: Union[str, None] = '84e743168b53'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column('learning_materials', sa.Column('file_url', sa.String(500), nullable=True))


def downgrade() -> None:
    op.drop_column('learning_materials', 'file_url')
