import { AlertCircle } from 'lucide-react';
import './InputField.css';

export default function InputField({
    label,
    type = 'text',
    value,
    onChange,
    placeholder,
    icon,
    error,
    disabled,
    ...props
}) {
    return (
        <div className="input-field">
            {label && <label className="input-field__label">{label}</label>}
            <div className={`input-field__wrapper ${error ? 'input-field__wrapper--error' : ''} ${disabled ? 'input-field__wrapper--disabled' : ''}`}>
                {icon && <span className="input-field__icon">{icon}</span>}
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="input-field__input"
                    {...props}
                />
            </div>
            {error && (
                <span className="input-field__error">
                    <AlertCircle size={14} strokeWidth={2.5} />
                    {error}
                </span>
            )}
        </div>
    );
}
