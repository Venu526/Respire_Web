import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Mail, Lock, KeyRound } from 'lucide-react';
import api from '../services/api';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';
import { validatePassword } from '../utils/validationUtils';
import './ForgotPasswordPage.css';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newpass
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        if (!email.trim()) { setError('Please enter your email'); return; }
        setIsLoading(true);
        try {
            await api.forgotPassword(email.trim());
            setStep(2);
        } catch (err) {
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        if (!otp.trim()) { setError('Please enter the OTP'); return; }
        setIsLoading(true);
        try {
            await api.verifyOTP(email.trim(), otp.trim());
            setStep(3);
        } catch (err) {
            setError(err.message || 'Invalid OTP. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        if (!validatePassword(newPassword)) {
            setError('Password must be at least 6 characters and contain both letters and numbers');
            return;
        }
        if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
        setIsLoading(true);
        try {
            await api.resetPassword(email.trim(), otp.trim(), newPassword);
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Failed to reset password.');
        } finally {
            setIsLoading(false);
        }
    };

    if (success) {
        return (
            <div className="forgot-page">
                <div className="forgot-page__container">
                    <div className="forgot-success">
                        <div className="forgot-success__icon">✓</div>
                        <h2>Password Reset!</h2>
                        <p>Your password has been successfully reset. Please login with your new password.</p>
                        <GradientButton onClick={() => navigate('/login')}>
                            Back to Login
                        </GradientButton>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="forgot-page">
            <div className="forgot-page__container">
                <button className="forgot-page__back" onClick={() => step > 1 ? setStep(step - 1) : navigate('/login')}>
                    <ChevronLeft size={20} />
                    <span>Back</span>
                </button>

                {/* Step indicator */}
                <div className="forgot-page__steps">
                    <div className={`forgot-page__step ${step >= 1 ? 'forgot-page__step--active' : ''}`}>
                        <div className="forgot-page__step-dot">1</div>
                        <span>Email</span>
                    </div>
                    <div className="forgot-page__step-line" />
                    <div className={`forgot-page__step ${step >= 2 ? 'forgot-page__step--active' : ''}`}>
                        <div className="forgot-page__step-dot">2</div>
                        <span>OTP</span>
                    </div>
                    <div className="forgot-page__step-line" />
                    <div className={`forgot-page__step ${step >= 3 ? 'forgot-page__step--active' : ''}`}>
                        <div className="forgot-page__step-dot">3</div>
                        <span>Reset</span>
                    </div>
                </div>

                {error && (
                    <div className="forgot-page__error">
                        <span>⚠</span> <span>{error}</span>
                    </div>
                )}

                {/* Step 1: Email */}
                {step === 1 && (
                    <form onSubmit={handleSendOTP} className="forgot-page__form">
                        <div className="forgot-page__header">
                            <h1>Forgot Password</h1>
                            <p>Enter your email address and we'll send you a verification code.</p>
                        </div>
                        <InputField
                            label="Email Address"
                            type="email"
                            value={email}
                            onChange={setEmail}
                            placeholder="name@example.com"
                            icon={<Mail size={18} />}
                        />
                        <GradientButton type="submit" loading={isLoading}>
                            Send OTP
                        </GradientButton>
                    </form>
                )}

                {/* Step 2: OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerifyOTP} className="forgot-page__form">
                        <div className="forgot-page__header">
                            <h1>Verify OTP</h1>
                            <p>Enter the 6-digit code sent to <strong>{email}</strong></p>
                        </div>
                        <InputField
                            label="Verification Code"
                            value={otp}
                            onChange={setOtp}
                            placeholder="Enter 6-digit OTP"
                            icon={<KeyRound size={18} />}
                        />
                        <GradientButton type="submit" loading={isLoading}>
                            Verify Code
                        </GradientButton>
                    </form>
                )}

                {/* Step 3: New Password */}
                {step === 3 && (
                    <form onSubmit={handleResetPassword} className="forgot-page__form">
                        <div className="forgot-page__header">
                            <h1>New Password</h1>
                            <p>Create a strong new password for your account.</p>
                        </div>
                        <InputField
                            label="New Password"
                            type="password"
                            value={newPassword}
                            onChange={setNewPassword}
                            placeholder="At least 6 characters (Letters & Numbers)"
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
                        <GradientButton type="submit" loading={isLoading}>
                            Reset Password
                        </GradientButton>
                    </form>
                )}
            </div>
        </div>
    );
}
