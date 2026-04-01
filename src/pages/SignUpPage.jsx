import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, UserCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';
import RoleSelector from '../components/RoleSelector';
import { validateEmail, validatePassword, validateName } from '../utils/validationUtils';
import './SignUpPage.css';

export default function SignUpPage() {
    const navigate = useNavigate();
    const { register } = useAuth();

    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [selectedRole, setSelectedRole] = useState('patient');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');

        const trimmedName = fullName.trim();
        const trimmedEmail = email.trim();
        const trimmedPass = password.trim();
        const trimmedConfirm = confirmPassword.trim();

        if (!validateName(trimmedName)) { 
            setError('Please enter a valid name (2-50 characters)'); 
            return; 
        }
        if (!validateEmail(trimmedEmail)) {
            setError('Please enter a valid email address'); 
            return;
        }
        if (!validatePassword(trimmedPass)) { 
            setError('Password must be at least 6 characters and contain both letters and numbers'); 
            return; 
        }
        if (trimmedPass !== trimmedConfirm) { 
            setError('Passwords do not match'); 
            return; 
        }

        setIsLoading(true);
        try {
            await register(trimmedName, trimmedEmail, trimmedPass, selectedRole);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Unable to connect. Please check your connection.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="signup-page">
                <div className="signup-page__container">
                    <div className="signup-success">
                        <div className="signup-success__icon">✓</div>
                        <h2>Account Created!</h2>
                        <p>Your account has been created successfully. Please log in.</p>
                        <GradientButton onClick={() => navigate('/login')}>
                            Go to Login
                        </GradientButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="signup-page">
            <div className="signup-page__bg">
                <div className="signup-page__bg-circle signup-page__bg-circle--1" />
                <div className="signup-page__bg-circle signup-page__bg-circle--2" />
            </div>

            <div className="signup-page__container">
                <form className="signup-page__form" onSubmit={handleSignUp}>
                    <button
                        type="button"
                        className="signup-page__back"
                        onClick={() => navigate('/login')}
                    >
                        <ChevronLeft size={20} />
                        <span>Back</span>
                    </button>

                    <div className="signup-page__header">
                        <h1>Create Account</h1>
                        <p>Set up your account to monitor respiratory health.</p>
                    </div>

                    {error && (
                        <div className="signup-page__error">
                            <span>⚠</span>
                            <span>{error}</span>
                        </div>
                    )}

                    <RoleSelector
                        selectedRole={selectedRole}
                        onSelect={setSelectedRole}
                    />

                    <InputField
                        label="Full Name"
                        value={fullName}
                        onChange={setFullName}
                        placeholder="John Doe"
                        icon={<UserCircle size={18} />}
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
                        placeholder="At least 4 characters"
                        icon={<Lock size={18} />}
                    />

                    <InputField
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={setConfirmPassword}
                        placeholder="Re-enter password"
                        icon={<Lock size={18} />}
                    />

                    <GradientButton
                        type="submit"
                        loading={isLoading}
                    >
                        Create Account
                    </GradientButton>

                    <div className="signup-page__login">
                        <span>Already have an account?</span>
                        <Link to="/login">Sign In</Link>
                    </div>
                </form>
            </div>
        </div>
    );
}
