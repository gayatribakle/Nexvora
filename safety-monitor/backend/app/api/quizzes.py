from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

from app.database.session import get_db
from app.database.models import Quiz, QuizAttempt, Worker, User
from app.auth.dependencies import get_current_user
from app.services.worker_service import WorkerService

router = APIRouter(prefix="/quizzes", tags=["Quizzes"])


@router.get("")
def list_quizzes(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quizzes = db.query(Quiz).filter(Quiz.is_active == True).all()
    return [
        {
            "id": q.id,
            "title": q.title,
            "description": q.description,
            "passing_score": q.passing_score,
            "time_limit_minutes": q.time_limit_minutes,
            "total_questions": len(q.questions) if q.questions else 0,
        }
        for q in quizzes
    ]


@router.get("/{quiz_id}")
def get_quiz(quiz_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions_no_answers = []
    if quiz.questions:
        for q in quiz.questions:
            questions_no_answers.append({
                "question": q.get("question"),
                "options": q.get("options"),
                "index": len(questions_no_answers),
            })

    return {
        "id": quiz.id,
        "title": quiz.title,
        "description": quiz.description,
        "passing_score": quiz.passing_score,
        "time_limit_minutes": quiz.time_limit_minutes,
        "questions": questions_no_answers,
    }


@router.post("/{quiz_id}/submit")
def submit_quiz(
    quiz_id: int,
    answers: list,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can submit quizzes")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    quiz = db.query(Quiz).filter(Quiz.id == quiz_id).first()
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    questions = quiz.questions or []
    correct = 0
    total = len(questions)

    for i, ans in enumerate(answers):
        if i < len(questions):
            correct_idx = questions[i].get("correct", -1)
            if ans == correct_idx:
                correct += 1

    score = int((correct / total) * 100) if total > 0 else 0
    passed = score >= quiz.passing_score

    attempt = QuizAttempt(
        worker_id=worker.id,
        quiz_id=quiz_id,
        score=score,
        total_questions=total,
        correct_answers=correct,
        status="passed" if passed else "failed",
        answers=answers,
    )
    db.add(attempt)
    db.flush()

    if passed:
        worker.quizzes_passed += 1
        worker_svc = WorkerService(db)
        worker_svc.update_safety_score(worker.id, 3, "Quiz passed")

    db.commit()

    return {
        "score": score,
        "total": total,
        "correct": correct,
        "passed": passed,
        "passing_score": quiz.passing_score,
    }


@router.get("/attempts/history")
def get_attempts(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "worker":
        raise HTTPException(status_code=403, detail="Only workers can view attempts")

    worker = db.query(Worker).filter(Worker.user_id == current_user.id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    attempts = db.query(QuizAttempt).filter(
        QuizAttempt.worker_id == worker.id
    ).order_by(QuizAttempt.attempted_at.desc()).all()

    return [
        {
            "id": a.id,
            "quiz_title": a.quiz.title if a.quiz else "Unknown",
            "score": a.score,
            "total": a.total_questions,
            "correct": a.correct_answers,
            "status": a.status,
            "attempted_at": str(a.attempted_at),
        }
        for a in attempts
    ]
