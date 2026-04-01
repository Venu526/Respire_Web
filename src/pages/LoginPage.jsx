import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, ArrowRight, User, Stethoscope } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';
import RoleSelector from '../components/RoleSelector';
import { validateEmail } from '../utils/validationUtils';
import './LoginPage.css';

export default function LoginPage() {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('patient');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedEmail = email.trim();
        const trimmedPassword = password.trim();

        if (!trimmedEmail || !trimmedPassword) {
            setError('Please enter both email and password');
            return;
        }

        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address');
            return;
        }

        if (trimmedPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        setIsLoading(true);
        try {
            const user = await login(trimmedEmail, trimmedPassword, selectedRole);

            // Validate role
            const roleFromDB = user.role || 'patient';
            if (roleFromDB !== selectedRole) {
                setIsLoading(false);
                setError(
                    roleFromDB === 'doctor'
                        ? "This is a Doctor account. Please select 'Doctor' to login."
                        : "This is a Patient account. Please select 'Patient' to login."
                );
                return;
            }

            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Unable to connect. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            {/* Decorative background */}
            <div className="login-page__bg">
                <div className="login-page__bg-circle login-page__bg-circle--1" />
                <div className="login-page__bg-circle login-page__bg-circle--2" />
            </div>

            <div className="login-page__container">
                {/* Left - Branding (desktop only) */}
                <div className="login-page__branding">
                    <div className="login-page__branding-content">
                        <div className="login-page__branding-logo">
                            <div className="login-page__branding-icon">
                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" width="40" height="40">
                                    <path d="M6.5 12C6.5 12 4 8.5 4 6.5C4 3.5 6 2 8 2C10 2 12 4 12 4C12 4 14 2 16 2C18 2 20 3.5 20 6.5C20 8.5 17.5 12 17.5 12" />
                                    <path d="M12 4V22" />
                                    <path d="M4 15h4l2 -3l4 6l2 -3h4" />
                                </svg>
                            </div>
                        </div>
                        <h2 className="login-page__branding-title">RespireAI</h2>
                        <p className="login-page__branding-subtitle">
                            AI-Powered Respiratory Monitoring
                        </p>
                        <div className="login-page__branding-features">
                            <div className="login-page__branding-feature">
                                <span className="login-page__branding-check">✓</span>
                                <span>Real-time vital monitoring</span>
                            </div>
                            <div className="login-page__branding-feature">
                                <span className="login-page__branding-check">✓</span>
                                <span>AI-powered risk assessment</span>
                            </div>
                            <div className="login-page__branding-feature">
                                <span className="login-page__branding-check">✓</span>
                                <span>Clinical-grade analytics</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right - Form */}
                <div className="login-page__form-section">
                    <form className="login-page__form" onSubmit={handleLogin}>
                        <div className="login-page__header">
                            <h1>Welcome Back</h1>
                            <p>Sign in to access your respiratory data.</p>
                        </div>

                        {error && (
                            <div className="login-page__error">
                                <span>⚠</span>
                                <span>{error}</span>
                            </div>
                        )}

                        <RoleSelector
                            selectedRole={selectedRole}
                            onSelect={setSelectedRole}
                        />

                        <InputField
                            label="Email"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="name@example.com"
                            icon={<Mail size={18} />}
                        />

                        <InputField
                            label="Password"
                            type="password"
                            value={password}
                            onChange={setPassword}
                            placeholder="••••••••"
                            icon={<Lock size={18} />}
                        />

                        <div className="login-page__forgot">
                            <Link to="/forgot-password">Forgot Password?</Link>
                        </div>

                        <GradientButton
                            type="submit"
                            variant={selectedRole === 'doctor' ? 'doctor' : 'primary'}
                            loading={isLoading}
                            icon={selectedRole === 'doctor'
                                ? <Stethoscope size={18} />
                                : <User size={18} />
                            }
                        >
                            Login as {selectedRole === 'doctor' ? 'Doctor' : 'Patient'}
                            {!isLoading && <ArrowRight size={18} />}
                        </GradientButton>

                        <div className="login-page__signup">
                            <span>Don't have an account?</span>
                            <Link to="/signup">Sign Up</Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
