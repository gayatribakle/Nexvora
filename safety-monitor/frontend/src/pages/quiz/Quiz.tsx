import React, { useState, useEffect } from 'react'
import { quizzesAPI } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'

const Quiz: React.FC = () => {
  const [quizzes, setQuizzes] = useState<any[]>([])
  const [activeQuiz, setActiveQuiz] = useState<any>(null)
  const [answers, setAnswers] = useState<number[]>([])
  const [result, setResult] = useState<any>(null)
  const [attempts, setAttempts] = useState<any[]>([])
  const { isWorker } = useAuth()

  useEffect(() => {
    fetchQuizzes()
    if (isWorker) fetchAttempts()
  }, [isWorker])

  const fetchQuizzes = async () => {
    try {
      const res = await quizzesAPI.list()
      setQuizzes(res.data || [])
    } catch {}
  }

  const fetchAttempts = async () => {
    try {
      const res = await quizzesAPI.history()
      setAttempts(res.data || [])
    } catch {}
  }

  const startQuiz = async (id: number) => {
    try {
      const res = await quizzesAPI.get(id)
      setActiveQuiz(res.data)
      setAnswers(new Array(res.data.questions?.length || 0).fill(-1))
      setResult(null)
    } catch {}
  }

  const submitQuiz = async () => {
    if (!activeQuiz) return
    try {
      const res = await quizzesAPI.submit(activeQuiz.id, answers)
      setResult(res.data)
      setActiveQuiz(null)
      fetchAttempts()
    } catch {}
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-title">Safety Quizzes</div>
        <div className="page-subtitle">Test your safety knowledge and earn score points</div>
      </div>

      {result && (
        <div className={`alert-box ${result.passed ? 'success' : 'error'}`} style={{ marginBottom: 16 }}>
          <strong>{result.passed ? 'PASSED!' : 'FAILED'}</strong> - Score: {result.score}% ({result.correct}/{result.total} correct, Passing: {result.passing_score}%)
          {result.passed && <span> {'\u2705'} You earned +3 safety score points!</span>}
        </div>
      )}

      {activeQuiz ? (
        <div className="card">
          <div className="card-header">
            <div className="card-title">{activeQuiz.title}</div>
            <div style={{ fontSize: 13, color: 'var(--color-text-muted)' }}>
              {activeQuiz.questions?.length || 0} Questions
            </div>
          </div>
          <p style={{ color: 'var(--color-text-secondary)', marginBottom: 16 }}>{activeQuiz.description}</p>

          {activeQuiz.questions?.map((q: any, i: number) => (
            <div key={i} style={{ marginBottom: 20, padding: 16, background: 'var(--color-bg)', borderRadius: 8 }}>
              <div style={{ fontSize: 13, color: 'var(--color-text-muted)', marginBottom: 8 }}>Question {i + 1}/{activeQuiz.questions.length}</div>
              <div style={{ fontWeight: 500, marginBottom: 12 }}>{q.question}</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {q.options?.map((opt: string, j: number) => (
                  <label key={j} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px',
                    borderRadius: 6, cursor: 'pointer', fontSize: 13,
                    background: answers[i] === j ? 'rgba(0, 188, 212, 0.1)' : 'transparent',
                    border: `1px solid ${answers[i] === j ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}>
                    <input
                      type="radio"
                      name={`q-${i}`}
                      checked={answers[i] === j}
                      onChange={() => {
                        const newAnswers = [...answers]
                        newAnswers[i] = j
                        setAnswers(newAnswers)
                      }}
                    />
                    {opt}
                  </label>
                ))}
              </div>
            </div>
          ))}

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
            <button className="btn btn-outline" onClick={() => setActiveQuiz(null)}>Cancel</button>
            <button className="btn btn-primary" onClick={submitQuiz} disabled={answers.includes(-1)}>
              Submit Quiz
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-2" style={{ marginBottom: 24 }}>
            {quizzes.map((q: any) => (
              <div key={q.id} className="card" style={{ cursor: 'pointer' }} onClick={() => startQuiz(q.id)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div>
                    <div className="card-title" style={{ fontSize: 15 }}>{q.title}</div>
                    <span className="badge badge-blue">{q.total_questions || 0} Questions</span>
                    {q.time_limit_minutes && <span className="badge badge-gray" style={{ marginLeft: 4 }}>{q.time_limit_minutes} min</span>}
                  </div>
                  {isWorker && <button className="btn btn-primary btn-sm">Start</button>}
                </div>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)' }}>{q.description}</p>
                <div style={{ fontSize: 12, color: 'var(--color-text-muted)', marginTop: 8 }}>
                  Passing Score: {q.passing_score}%
                </div>
              </div>
            ))}
          </div>

          {isWorker && attempts.length > 0 && (
            <div className="card">
              <div className="card-header">
                <div className="card-title">Your Quiz History</div>
              </div>
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Quiz</th>
                      <th>Score</th>
                      <th>Result</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attempts.map((a: any) => (
                      <tr key={a.id}>
                        <td>{a.quiz_title}</td>
                        <td>{a.score}% ({a.correct}/{a.total})</td>
                        <td>
                          <span className={`badge badge-${a.status === 'passed' ? 'green' : 'red'}`}>
                            {a.status}
                          </span>
                        </td>
                        <td style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>{a.attempted_at}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export default Quiz
