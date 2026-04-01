import { useState } from 'react';
import { ChevronLeft, Plus, Minus, Wind, Heart, Droplet, Footprints, Moon, Check } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './HealthGoalsPage.css';

const DEFAULT_GOALS = [
    { id: 1, title: 'Breathing Exercises', icon: '🌬️', target: 3, current: 1, unit: 'sessions', color: '#3B82F6' },
    { id: 2, title: 'Vitals Check', icon: '❤️', target: 2, current: 2, unit: 'times', color: '#EF4444' },
    { id: 3, title: 'Water Intake', icon: '💧', target: 8, current: 5, unit: 'glasses', color: '#06B6D4' },
    { id: 4, title: 'Steps', icon: '🚶', target: 10000, current: 6500, unit: 'steps', color: '#10B981' },
    { id: 5, title: 'Sleep', icon: '🌙', target: 8, current: 7, unit: 'hours', color: '#6366F1' },
];

export default function HealthGoalsPage() {
    const navigate = useNavigate();
    const [goals, setGoals] = useState(DEFAULT_GOALS);

    const totalProgress = goals.reduce((sum, g) => sum + Math.min(g.current / g.target, 1), 0) / goals.length;
    const achieved = goals.filter(g => g.current >= g.target).length;

    const updateGoal = (id, delta) => {
        setGoals(prev => prev.map(g => g.id === id ? { ...g, current: Math.max(0, g.current + delta) } : g));
    };

    const circumference = 2 * Math.PI * 65;

    return (
        <div className="goals">
            <button className="goals__back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Back
            </button>
            <h1>Health Goals</h1>

            {/* Overall Progress Circle */}
            <div className="goals__progress-card">
                <h3>Today's Progress</h3>
                <div className="goals__circle-container">
                    <svg viewBox="0 0 150 150" className="goals__circle-svg">
                        <circle cx="75" cy="75" r="65" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="12" />
                        <circle cx="75" cy="75" r="65" fill="none" stroke="url(#goalGrad)" strokeWidth="12" strokeLinecap="round"
                            strokeDasharray={`${totalProgress * circumference} ${circumference}`} transform="rotate(-90 75 75)" />
                        <defs>
                            <linearGradient id="goalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stopColor="#3B82F6" />
                                <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                        </defs>
                    </svg>
                    <div className="goals__circle-text">
                        <span className="goals__circle-pct">{Math.round(totalProgress * 100)}%</span>
                        <span className="goals__circle-label">Complete</span>
                    </div>
                </div>
                <p className="goals__achieved">{achieved} of {goals.length} goals achieved</p>
            </div>

            {/* Goals List */}
            <div className="goals__section">
                <div className="goals__section-header">
                    <h3>Daily Goals</h3>
                </div>
                <div className="goals__list">
                    {goals.map(goal => {
                        const progress = Math.min(goal.current / goal.target, 1);
                        const isComplete = goal.current >= goal.target;
                        return (
                            <div key={goal.id} className="goal-card">
                                <div className="goal-card__top">
                                    <span className="goal-card__icon">{goal.icon}</span>
                                    <div className="goal-card__info">
                                        <span className="goal-card__title">{goal.title}</span>
                                        <span className="goal-card__count">{goal.current} / {goal.target} {goal.unit}</span>
                                    </div>
                                    {isComplete ? (
                                        <div className="goal-card__complete"><Check size={20} /></div>
                                    ) : (
                                        <div className="goal-card__controls">
                                            <button className="goal-card__btn" onClick={() => updateGoal(goal.id, -1)}>
                                                <Minus size={16} />
                                            </button>
                                            <button className="goal-card__btn goal-card__btn--add" style={{ color: goal.color }} onClick={() => updateGoal(goal.id, 1)}>
                                                <Plus size={16} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <div className="goal-card__bar-bg">
                                    <div className="goal-card__bar" style={{ width: `${progress * 100}%`, background: goal.color }} />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Tips */}
            <div className="goals__tips">
                <h3>💡 Tips</h3>
                <div className="goals__tip" style={{ borderLeftColor: '#3B82F6' }}>
                    <strong>Breathe Better</strong>
                    <p>Practice deep breathing for 5 minutes after waking up.</p>
                </div>
                <div className="goals__tip" style={{ borderLeftColor: '#06B6D4' }}>
                    <strong>Stay Hydrated</strong>
                    <p>Proper hydration helps maintain healthy oxygen levels.</p>
                </div>
            </div>
        </div>
    );
}
