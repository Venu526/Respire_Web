import { User, Stethoscope } from 'lucide-react';
import './RoleSelector.css';

export default function RoleSelector({ selectedRole, onSelect }) {
    return (
        <div className="role-selector">
            <label className="role-selector__label">Login as</label>
            <div className="role-selector__options">
                <button
                    type="button"
                    className={`role-selector__btn ${selectedRole === 'patient' ? 'role-selector__btn--active' : ''}`}
                    onClick={() => onSelect('patient')}
                >
                    <User size={18} />
                    <span>Patient</span>
                </button>
                <button
                    type="button"
                    className={`role-selector__btn role-selector__btn--doctor ${selectedRole === 'doctor' ? 'role-selector__btn--active role-selector__btn--doctor-active' : ''}`}
                    onClick={() => onSelect('doctor')}
                >
                    <Stethoscope size={18} />
                    <span>Doctor</span>
                </button>
            </div>
            <p className="role-selector__hint">
                Select your account type. Patient accounts cannot login as Doctor and vice versa.
            </p>
        </div>
    );
}
