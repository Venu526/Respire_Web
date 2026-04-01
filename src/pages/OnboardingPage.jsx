import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Wind, Activity, Brain, ArrowRight } from 'lucide-react';
import './OnboardingPage.css';

const pages = [
    {
        icon: Wind,
        iconColor: '#0066CC',
        title: 'Welcome to RespireAI',
        subtitle: 'Your personal respiratory health companion',
        description: 'Track vitals, monitor trends, and get early warnings for respiratory deterioration.',
    },
    {
        icon: Activity,
        iconColor: '#10B981',
        title: 'Track Your Vitals',
        subtitle: 'Comprehensive vital signs monitoring',
        description: 'Record SpO₂, respiratory rate, heart rate, blood pressure, and more with clinical-grade tracking.',
    },
    {
        icon: Brain,
        iconColor: '#7C3AED',
        title: 'AI-Powered Analysis',
        subtitle: 'Smart risk assessment',
        description: 'Our AI analyzes trends to detect early signs of deterioration and provides actionable recommendations.',
    },
];

export default function OnboardingPage() {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(0);
    const page = pages[currentPage];
    const isLast = currentPage === pages.length - 1;

    const handleNext = () => {
        if (isLast) {
            localStorage.setItem('hasCompletedOnboarding', 'true');
            navigate('/login');
        } else {
            setCurrentPage((prev) => prev + 1);
        }
    };

    const handleSkip = () => {
        localStorage.setItem('hasCompletedOnboarding', 'true');
        navigate('/login');
    };

    return (
        <div className="onboarding" style={{ '--accent': page.iconColor }}>
            {/* Background */}
            <div
                className="onboarding__bg"
                style={{ background: `linear-gradient(135deg, ${page.iconColor}15, var(--bg-primary))` }}
            />

            {/* Skip */}
            {!isLast && (
                <button className="onboarding__skip" onClick={handleSkip}>
                    Skip
                </button>
            )}

            {/* Content */}
            <div className="onboarding__content" key={currentPage}>
                {/* Icon */}
                <div className="onboarding__icon-container">
                    <div className="onboarding__icon-outer" style={{ background: `${page.iconColor}15` }}>
                        <div className="onboarding__icon-inner" style={{ background: `${page.iconColor}25` }}>
                            <page.icon size={50} color={page.iconColor} strokeWidth={1.5} />
                        </div>
                    </div>
                </div>

                {/* Text */}
                <div className="onboarding__text">
                    <h1 className="onboarding__title">{page.title}</h1>
                    <h3 className="onboarding__subtitle" style={{ color: page.iconColor }}>
                        {page.subtitle}
                    </h3>
                    <p className="onboarding__description">{page.description}</p>
                </div>
            </div>

            {/* Bottom */}
            <div className="onboarding__bottom">
                {/* Page indicator */}
                <div className="onboarding__dots">
                    {pages.map((_, i) => (
                        <span
                            key={i}
                            className={`onboarding__dot ${i === currentPage ? 'onboarding__dot--active' : ''}`}
                            style={i === currentPage ? { background: page.iconColor } : {}}
                        />
                    ))}
                </div>

                {/* Continue button */}
                <button
                    className="onboarding__btn"
                    style={{ background: page.iconColor }}
                    onClick={handleNext}
                >
                    <span>{isLast ? 'Get Started' : 'Continue'}</span>
                    {!isLast && <ArrowRight size={18} />}
                </button>
            </div>
        </div>
    );
}
