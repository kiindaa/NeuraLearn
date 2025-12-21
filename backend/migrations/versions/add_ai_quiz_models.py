"""Add AI quiz generation models

Revision ID: 1234567890ab
Revises: fb01ac6db073
Create Date: 2023-11-15 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '1234567890ab'
down_revision = 'fb01ac6db073'
branch_labels = None
depends_on = None


def upgrade():
    # Create enums first
    op.execute("""
    CREATE TYPE ai_quiz_difficulty AS ENUM ('easy', 'medium', 'hard');
    CREATE TYPE ai_question_type AS ENUM ('multiple_choice', 'short_answer', 'true_false');
    """)
    
    # Create tables
    op.create_table(
        'ai_generated_quizzes',
        sa.Column('id', sa.String(36), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('student_id', sa.String(36), sa.ForeignKey('users.id', ondelete='CASCADE'), nullable=False),
        sa.Column('session_uuid', postgresql.UUID(as_uuid=True), nullable=False, server_default=sa.text('gen_random_uuid()')),
        sa.Column('topic_ids', postgresql.ARRAY(sa.String(36)), server_default='{}', nullable=False),
        sa.Column('difficulty', sa.Enum('easy', 'medium', 'hard', name='ai_quiz_difficulty'), nullable=True),
        sa.Column('question_types', postgresql.ARRAY(sa.String(50)), server_default='{}', nullable=True),
        sa.Column('total_questions', sa.Integer, server_default='5', nullable=False),
        sa.Column('generated_at', sa.DateTime, server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_uuid')
    )
    
    op.create_table(
        'ai_questions',
        sa.Column('id', sa.String(36), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('quiz_id', sa.String(36), sa.ForeignKey('ai_generated_quizzes.id', ondelete='CASCADE'), nullable=False),
        sa.Column('question_text', sa.Text, nullable=False),
        sa.Column('question_type', sa.Enum('multiple_choice', 'short_answer', 'true_false', name='ai_question_type'), nullable=True),
        sa.Column('options', postgresql.JSONB, nullable=True),
        sa.Column('correct_answer', sa.Text, nullable=True),
        sa.Column('student_answer', sa.Text, nullable=True),
        sa.Column('is_correct', sa.Boolean, nullable=True),
        sa.Column('explanation', sa.Text, nullable=True),
        sa.Column('answered_at', sa.DateTime, nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    op.create_table(
        'course_topics',
        sa.Column('id', sa.String(36), primary_key=True, server_default=sa.text('gen_random_uuid()')),
        sa.Column('course_id', sa.String(36), sa.ForeignKey('courses.id', ondelete='CASCADE'), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('description', sa.Text, nullable=True),
        sa.Column('order_index', sa.Integer, nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    
    # Create indexes
    op.create_index('idx_ai_quiz_student', 'ai_generated_quizzes', ['student_id'])
    op.create_index('idx_ai_question_quiz', 'ai_questions', ['quiz_id'])
    op.create_index('idx_course_topic_course', 'course_topics', ['course_id'])


def downgrade():
    # Drop indexes
    op.drop_index('idx_ai_quiz_student', table_name='ai_generated_quizzes')
    op.drop_index('idx_ai_question_quiz', table_name='ai_questions')
    op.drop_index('idx_course_topic_course', table_name='course_topics')
    
    # Drop tables
    op.drop_table('ai_questions')
    op.drop_table('ai_generated_quizzes')
    op.drop_table('course_topics')
    
    # Drop enums
    op.execute("""
    DROP TYPE IF EXISTS ai_question_type;
    DROP TYPE IF EXISTS ai_quiz_difficulty;
    """)
