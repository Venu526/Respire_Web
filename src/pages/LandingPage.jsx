import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wind, Activity, Brain, TrendingUp, Bell } from 'lucide-react';
import './LandingPage.css';

export default function LandingPage() {
    const navigate = useNavigate();
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        requestAnimationFrame(() => setLoaded(true));
    }, []);

    // Generate particles with random positions
    const particles = useMemo(() =>
        Array.from({ length: 20 }, (_, i) => ({
            id: i,
            left: Math.random() * 100,
            size: 4 + Math.random() * 8,
            opacity: 0.1 + Math.random() * 0.2,
            duration: 6 + Math.random() * 6,
            delay: Math.random() * 4,
        })), []
    );

    return (
        <div className={`landing ${loaded ? 'landing--loaded' : ''}`}>
            {/* Background gradient */}
            <div className="landing__bg" />

            {/* Floating particles */}
            <div className="landing__particles">
                {particles.map((p) => (
                    <div
                        key={p.id}
                        className="landing__particle"
                        style={{
                            left: `${p.left}%`,
                            width: `${p.size}px`,
                            height: `${p.size}px`,
                            opacity: p.opacity,
                            animationDuration: `${p.duration}s`,
                            animationDelay: `${p.delay}s`,
                        }}
                    />
                ))}
            </div>

            {/* Breathing rings */}
            <div className="landing__rings">
                <div className="landing__ring landing__ring--1" />
                <div className="landing__ring landing__ring--2" />
                <div className="landing__ring landing__ring--3" />
            </div>

            {/* Main content */}
            <div className="landing__content">
                <div className="landing__hero">
                    {/* Logo */}
                    <div className="landing__logo-container">
                        <div className="landing__logo-glow" />
                        <div className="landing__logo-ring" />
                        <div className="landing__logo-circle">
                            <div className="landing__logo-icons">
                                <Wind className="landing__icon-lungs" size={42} strokeWidth={1.5} />
                                <Activity className="landing__icon-ecg" size={28} strokeWidth={2} />
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="landing__title-group">
                        <h1 className="landing__title">RespireAI</h1>
                        <p className="landing__tagline">AI-Powered Respiratory Monitoring</p>
                    </div>
                </div>

                {/* Bottom section */}
                <div className="landing__bottom">
                    {/* Loading dots */}
                    <div className="landing__dots">
                        <span className="landing__dot" style={{ animationDelay: '0s' }} />
                        <span className="landing__dot" style={{ animationDelay: '0.2s' }} />
                        <span className="landing__dot" style={{ animationDelay: '0.4s' }} />
                    </div>

                    {/* Feature badges */}
                    <div className="landing__features">
                        <div className="landing__feature">
                            <Brain size={22} />
                            <span>AI Analysis</span>
                        </div>
                        <div className="landing__feature">
                            <TrendingUp size={22} />
                            <span>Trends</span>
                        </div>
                        <div className="landing__feature">
                            <Bell size={22} />
                            <span>Alerts</span>
                        </div>
                    </div>

                    {/* CTA Buttons */}
                    <div className="landing__cta">
                        <button
                            className="landing__btn landing__btn--primary"
                            onClick={() => navigate('/login')}
                        >
                            Get Started
                        </button>
                        <button
                            className="landing__btn landing__btn--ghost"
                            onClick={() => navigate('/login')}
                        >
                            Already have an account? Sign In
                        </button>
                    </div>

                    <p className="landing__footer-text">
                        Medical Grade • Secure • Real-time
                    </p>
                </div>
            </div>
        </div>
    );
}
