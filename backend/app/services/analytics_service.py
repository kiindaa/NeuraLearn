from typing import Dict, List
from sqlalchemy import func
from datetime import datetime
from app.models import LessonCompletion, Progress, Course, Lesson, Enrollment, db

class AnalyticsService:
    def completed_lessons_summary(self, user_id: str) -> Dict:
        total_completed = db.session.query(func.count(LessonCompletion.id)) \
            .filter(LessonCompletion.user_id == user_id).scalar() or 0

        # If no granular completions recorded yet, fall back to Progress sum
        if total_completed == 0:
            total_completed = db.session.query(func.coalesce(func.sum(Progress.completed_lessons), 0)) \
                .filter(Progress.user_id == user_id).scalar() or 0

        avg_score = db.session.query(func.avg(LessonCompletion.score)) \
            .filter(LessonCompletion.user_id == user_id, LessonCompletion.score.isnot(None)).scalar()
        if avg_score is None:
            avg_score = db.session.query(func.coalesce(func.avg(Progress.average_score), 0)) \
                .filter(Progress.user_id == user_id).scalar() or 0

        total_minutes = db.session.query(func.coalesce(func.sum(LessonCompletion.time_spent_minutes), 0)) \
            .filter(LessonCompletion.user_id == user_id).scalar() or 0
        # Heuristic if not tracked
        if total_minutes == 0 and total_completed:
            total_minutes = int(total_completed * 18)

        hours = total_minutes // 60
        minutes = total_minutes % 60
        total_time = f"{hours}h {minutes}m"

        return {
            'totalCompleted': int(total_completed),
            'averageScore': round(float(avg_score), 1) if avg_score is not None else 0,
            'totalTime': total_time,
        }

    def completed_lessons_list(self, user_id: str) -> List[Dict]:
        # Prefer granular LessonCompletion records
        completions = LessonCompletion.query.filter_by(user_id=user_id).order_by(LessonCompletion.completed_at.desc()).all()
        items: List[Dict] = []
        if completions:
            # Build list from real events
            course_titles = {c.id: c.title for c in Course.query.filter(Course.id.in_({c.course_id for c in completions})).all()}
            lesson_titles = {l.id: l.title for l in Lesson.query.filter(Lesson.id.in_({c.lesson_id for c in completions})).all()}
            for c in completions:
                items.append({
                    'id': c.lesson_id,
                    'title': lesson_titles.get(c.lesson_id) or 'Lesson',
                    'courseTitle': course_titles.get(c.course_id) or 'Course',
                    'completedAt': c.completed_at.isoformat() if c.completed_at else datetime.utcnow().isoformat(),
                    'timeSpent': f"{c.time_spent_minutes}m" if c.time_spent_minutes else '—',
                    'quizScore': int(round(c.score)) if c.score is not None else None,
                })
            return items

        # Fallback: derive from Progress snapshots
        enrollments = Enrollment.query.filter_by(user_id=user_id).all()
        course_ids = [en.course_id for en in enrollments]
        progresses = {p.course_id: p for p in Progress.query.filter(Progress.user_id == user_id, Progress.course_id.in_(course_ids)).all()}
        for course in Course.query.filter(Course.id.in_(course_ids)).all():
            prog = progresses.get(course.id)
            if not prog or prog.completed_lessons <= 0:
                continue
            lessons_q = Lesson.query.filter(Lesson.course_id == course.id).order_by(Lesson.order.asc())
            completed = lessons_q.limit(prog.completed_lessons).all()
            for lesson in completed:
                items.append({
                    'id': lesson.id,
                    'title': lesson.title,
                    'courseTitle': course.title,
                    'completedAt': (prog.updated_at or prog.created_at).isoformat(),
                    'timeSpent': f"{max(lesson.duration or 15, 10)}m",
                    'quizScore': int(round(prog.average_score or 0)),
                })
        items.sort(key=lambda x: x['completedAt'], reverse=True)
        return items
