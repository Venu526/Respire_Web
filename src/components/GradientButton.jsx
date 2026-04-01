import './GradientButton.css';

export default function GradientButton({
    children,
    onClick,
    variant = 'primary',
    loading = false,
    disabled = false,
    fullWidth = true,
    icon,
    type = 'button',
}) {
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={disabled || loading}
            className={`gradient-btn gradient-btn--${variant} ${fullWidth ? 'gradient-btn--full' : ''}`}
        >
            {loading ? (
                <span className="gradient-btn__spinner" />
            ) : (
                <>
                    {icon && <span className="gradient-btn__icon">{icon}</span>}
                    <span>{children}</span>
                </>
            )}
        </button>
    );
}
