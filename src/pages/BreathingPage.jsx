import { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, Play, Pause, Square, Moon, Box, Leaf, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './BreathingPage.css';

const EXERCISES = [
    {
        id: 'relaxing', name: '4-7-8 Relaxing', desc: 'Inhale 4s, Hold 7s, Exhale 8s. Great for sleep and anxiety.', icon: Moon, color: '#6366F1',
        phases: [{ name: 'Inhale', duration: 4, color: '#3B82F6' }, { name: 'Hold', duration: 7, color: '#7C3AED' }, { name: 'Exhale', duration: 8, color: '#10B981' }]
    },
    {
        id: 'box', name: 'Box Breathing', desc: 'Equal 4s intervals. Used by Navy SEALs for focus.', icon: Box, color: '#3B82F6',
        phases: [{ name: 'Inhale', duration: 4, color: '#3B82F6' }, { name: 'Hold', duration: 4, color: '#7C3AED' }, { name: 'Exhale', duration: 4, color: '#10B981' }, { name: 'Hold', duration: 4, color: '#F59E0B' }]
    },
    {
        id: 'calm', name: 'Calming Breath', desc: 'Slow, deep breaths. Perfect for stress relief.', icon: Leaf, color: '#10B981',
        phases: [{ name: 'Inhale', duration: 5, color: '#3B82F6' }, { name: 'Exhale', duration: 5, color: '#10B981' }]
    },
    {
        id: 'energizing', name: 'Energizing', desc: 'Quick inhales, long exhales. Boosts alertness.', icon: Zap, color: '#F59E0B',
        phases: [{ name: 'Inhale', duration: 2, color: '#F59E0B' }, { name: 'Exhale', duration: 6, color: '#3B82F6' }]
    },
];

const TOTAL_CYCLES = 4;

export default function BreathingPage() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState(EXERCISES[0]);
    const [isActive, setIsActive] = useState(false);
    const [renderTick, setRenderTick] = useState(0);

    // Use refs for all mutable state to avoid stale closures in rAF
    const animRef = useRef(null);
    const startTimeRef = useRef(0);
    const isRunningRef = useRef(false);
    const phaseIdxRef = useRef(0);
    const cycleRef = useRef(0);
    const progressRef = useRef(0);
    const breathScaleRef = useRef(0.5);
    const selectedRef = useRef(selected);
    const countdownRef = useRef(0);

    // Keep selectedRef in sync
    useEffect(() => { selectedRef.current = selected; }, [selected]);

    const triggerRender = useCallback(() => setRenderTick(t => t + 1), []);

    const animate = useCallback((timestamp) => {
        if (!isRunningRef.current) return;

        if (!startTimeRef.current) startTimeRef.current = timestamp;
        const elapsed = (timestamp - startTimeRef.current) / 1000;
        const ex = selectedRef.current;
        const phase = ex.phases[phaseIdxRef.current];
        const duration = phase.duration;
        const frac = Math.min(elapsed / duration, 1);

        progressRef.current = frac;
        countdownRef.current = Math.max(Math.ceil(duration - elapsed), 0);

        // Calculate breath scale
        const startScale = phase.name === 'Inhale' ? 0.5 : phase.name === 'Exhale' ? 1 : breathScaleRef.current;
        const targetScale = phase.name === 'Inhale' ? 1 : phase.name === 'Exhale' ? 0.5 : breathScaleRef.current;
        breathScaleRef.current = startScale + (targetScale - startScale) * frac;

        triggerRender();

        if (frac < 1) {
            animRef.current = requestAnimationFrame(animate);
        } else {
            // Move to next phase
            const nextIdx = phaseIdxRef.current + 1;
            if (nextIdx >= ex.phases.length) {
                const nextCycle = cycleRef.current + 1;
                if (nextCycle >= TOTAL_CYCLES) {
                    isRunningRef.current = false;
                    setIsActive(false);
                    triggerRender();
                    return;
                }
                cycleRef.current = nextCycle;
                phaseIdxRef.current = 0;
            } else {
                phaseIdxRef.current = nextIdx;
            }
            progressRef.current = 0;
            startTimeRef.current = 0;
            animRef.current = requestAnimationFrame(animate);
        }
    }, [triggerRender]);

    useEffect(() => {
        return () => { if (animRef.current) cancelAnimationFrame(animRef.current); };
    }, []);

    const startExercise = () => {
        phaseIdxRef.current = 0;
        cycleRef.current = 0;
        progressRef.current = 0;
        breathScaleRef.current = 0.5;
        startTimeRef.current = 0;
        isRunningRef.current = true;
        setIsActive(true);
        triggerRender();
        animRef.current = requestAnimationFrame(animate);
    };

    const stopExercise = () => {
        isRunningRef.current = false;
        if (animRef.current) cancelAnimationFrame(animRef.current);
        phaseIdxRef.current = 0;
        cycleRef.current = 0;
        progressRef.current = 0;
        breathScaleRef.current = 0.5;
        setIsActive(false);
        triggerRender();
    };

    const togglePause = () => {
        if (isRunningRef.current) {
            isRunningRef.current = false;
            if (animRef.current) cancelAnimationFrame(animRef.current);
        } else {
            isRunningRef.current = true;
            startTimeRef.current = 0; // Will be set on next frame
            // Adjust: keep remaining time by modifying startTime in animate
            animRef.current = requestAnimationFrame(animate);
        }
        triggerRender();
    };

    // Derived state from refs for rendering
    const currentPhase = selected.phases[phaseIdxRef.current] || selected.phases[0];
    const progress = progressRef.current;
    const breathScale = breathScaleRef.current;
    const cycle = cycleRef.current;
    const isRunning = isRunningRef.current;
    const countdown = countdownRef.current;

    if (isActive) {
        return (
            <div className="breathing-active" style={{ background: `linear-gradient(180deg, ${currentPhase.color}40, #0F172A)` }}>
                <button className="breathing-active__close" onClick={stopExercise}>✕</button>
                <span className="breathing-active__cycle">Cycle {cycle + 1} of {TOTAL_CYCLES}</span>
                <div className="breathing-active__circle-container">
                    <svg viewBox="0 0 200 200" className="breathing-active__ring">
                        <circle cx="100" cy="100" r="90" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
                        <circle cx="100" cy="100" r="90" fill="none" stroke={currentPhase.color} strokeWidth="5" strokeLinecap="round"
                            strokeDasharray={`${progress * 565.5} 565.5`} transform="rotate(-90 100 100)" />
                    </svg>
                    <div className="breathing-active__breath" style={{ transform: `scale(${breathScale})`, background: `radial-gradient(circle, ${currentPhase.color}CC, ${currentPhase.color}40)` }} />
                    <div className="breathing-active__text">
                        <span className="breathing-active__phase">{currentPhase.name}</span>
                        <span className="breathing-active__duration">{countdown}s</span>
                    </div>
                </div>
                <div className="breathing-active__controls">
                    <button className="breathing-active__btn" style={{ background: currentPhase.color }}
                        onClick={togglePause}>
                        {isRunning ? <Pause size={24} /> : <Play size={24} />}
                    </button>
                    <button className="breathing-active__btn breathing-active__btn--stop" onClick={stopExercise}>
                        <Square size={24} />
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="breathing">
            <button className="breathing__back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Back
            </button>

            <div className="breathing__hero">
                <div className="breathing__hero-icon">🌬️</div>
                <h1>Breathing Exercises</h1>
                <p>Improve your respiratory health with guided breathing</p>
            </div>

            <div className="breathing__section">
                <h3>Choose Exercise</h3>
                <div className="breathing__exercises">
                    {EXERCISES.map(ex => (
                        <button key={ex.id} className={`breathing__exercise ${selected.id === ex.id ? 'breathing__exercise--selected' : ''}`}
                            style={selected.id === ex.id ? { borderColor: ex.color, background: `${ex.color}08` } : {}}
                            onClick={() => setSelected(ex)}>
                            <div className="breathing__exercise-icon" style={{ background: ex.color }}>
                                <ex.icon size={22} color="#fff" />
                            </div>
                            <div className="breathing__exercise-info">
                                <span className="breathing__exercise-name">{ex.name}</span>
                                <span className="breathing__exercise-desc">{ex.desc}</span>
                            </div>
                            {selected.id === ex.id && <span className="breathing__exercise-check" style={{ color: ex.color }}>✓</span>}
                        </button>
                    ))}
                </div>
            </div>

            <button className="breathing__start" style={{ background: selected.color }} onClick={startExercise}>
                <Play size={18} /> Start Exercise
            </button>

            <div className="breathing__benefits">
                <h3>Benefits</h3>
                <div className="breathing__benefit"><span style={{ color: '#EF4444' }}>❤️</span> Reduces heart rate and blood pressure</div>
                <div className="breathing__benefit"><span style={{ color: '#7C3AED' }}>🧠</span> Decreases stress and anxiety</div>
                <div className="breathing__benefit"><span style={{ color: '#3B82F6' }}>🫁</span> Improves lung capacity</div>
                <div className="breathing__benefit"><span style={{ color: '#6366F1' }}>🌙</span> Promotes better sleep</div>
            </div>
        </div>
    );
}
