import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
    Mail, Phone, Calendar, Edit2, Camera, 
    Users, Bell, BookOpen, Pill, ChevronLeft, Wind,
    Droplets, Ruler, Scale
} from 'lucide-react';
import GradientButton from '../components/GradientButton';
import api from '../services/api';
import { 
    validateEmail, validateName, validatePhone, validateDOB,
    validateHeight, validateWeight 
} from '../utils/validationUtils';
import './ProfilePage.css';

export default function ProfilePage() {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const [editing, setEditing] = useState(false);
    const [stats, setStats] = useState(null);
    const [isAvailable, setIsAvailable] = useState(true);
    
    // Form States
    const [name, setName] = useState(user?.name || '');
    const [email, setEmail] = useState(user?.email || '');
    const [phone, setPhone] = useState(user?.phone || '');
    const [dob, setDob] = useState(user?.dob || '');
    const [gender, setGender] = useState(user?.gender || '');
    const [bloodGroup, setBloodGroup] = useState(user?.blood_group || '');
    const [height, setHeight] = useState(user?.height || '');
    const [weight, setWeight] = useState(user?.weight || '');
    const [fieldErrors, setFieldErrors] = useState({});
    
    const [uploading, setUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef(null);

    const initials = (n) => n ? n.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'U';
    const isDoctor = user?.role === 'doctor';
    const photoUrl = api.getPhotoUrl(user?.photo_url);

    useEffect(() => {
        if (isDoctor && user?.id) {
            loadStats();
        }
    }, [user?.id, isDoctor]);

    const loadStats = async () => {
        try {
            const data = await api.fetchDoctorDashboard(user.id);
            if (data && data.stats) {
                setStats(data.stats);
            }
        } catch (err) {
            console.error('Failed to load profile stats:', err);
        }
    };

    const handlePhotoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file || !user?.id) return;
        setUploading(true);
        try {
            const result = await api.uploadPhoto(user.id, file);
            if (result.success && result.photo_url) {
                updateUser({ photo_url: result.photo_url });
            }
        } catch (err) {
            console.error('Photo upload failed:', err);
        } finally {
            setUploading(false);
        }
    };

    const validateForm = () => {
        const errors = {};
        if (!validateName(name)) errors.name = 'Please enter a valid name (2-50 chars)';
        if (!validateEmail(email)) errors.email = 'Invalid email address';
        if (!validatePhone(phone)) errors.phone = 'Should be 10 digits';
        if (!validateDOB(dob)) errors.dob = 'DOB cannot be in future';
        
        if (!isDoctor) {
            if (!validateHeight(height)) errors.height = 'Valid height: 50-250cm';
            if (!validateWeight(weight)) errors.weight = 'Valid weight: 20-300kg';
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSave = async () => {
        if (!user?.id) return;
        if (!validateForm()) return;
        
        setIsSaving(true);
        try {
            const profileData = { 
                name, email, phone, dob,
                gender, blood_group: bloodGroup, height, weight
            };
            await api.updateProfile(user.id, profileData);
            updateUser(profileData);
            setEditing(false);
        } catch (err) {
            alert(`Failed: ${err.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    const StatCard = ({ icon: Icon, label, value, color, bg }) => (
        <div className="profile-stat-card">
            <div className="profile-stat-card__icon" style={{ backgroundColor: bg, color: color }}>
                <Icon size={22} strokeWidth={2.5} />
            </div>
            <div className="profile-stat-card__info">
                <span className="profile-stat-card__value">{value}</span>
                <span className="profile-stat-card__label">{label}</span>
            </div>
        </div>
    );

    return (
        <div className="profile-page">
            <header className="profile-page__header">
                <button className="profile-page__back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="profile-page__title">{isDoctor ? 'Doctor' : 'My'} Profile</h1>
            </header>

            <div className="profile-page__content">
                {/* Avatar Section */}
                <div className="profile-page__hero">
                    <div className="profile-page__avatar-outer" onClick={() => fileInputRef.current?.click()}>
                        <div className="profile-page__avatar-inner">
                            {photoUrl ? (
                                <img src={photoUrl} alt={user?.name} className="profile-page__avatar-img" />
                            ) : (
                                <div className="profile-page__avatar-placeholder">
                                    {initials(user?.name)}
                                </div>
                            )}
                            <div className="profile-page__camera-badge">
                                {uploading ? <div className="profile-page__spinner" /> : <Camera size={14} color="white" />}
                            </div>
                        </div>
                    </div>
                    <h2 className="profile-page__name">{user?.name || 'User'}</h2>
                    <span className="profile-page__badge">{isDoctor ? 'Doctor' : 'Patient'}</span>
                    <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handlePhotoUpload} />
                </div>

                {/* Stats Grid - DOCTOR VIEW */}
                {isDoctor && (
                    <div className="profile-stats-grid">
                        <StatCard 
                            icon={Users} 
                            label="Patients Seen" 
                            value={stats?.total_patients || 0} 
                            color="#0066CC" 
                            bg="rgba(0,102,204,0.08)" 
                        />
                        <StatCard 
                            icon={Bell} 
                            label="Pending Alerts" 
                            value={stats?.pending_alerts || 0} 
                            color="#EF4444" 
                            bg="rgba(239,68,68,0.08)" 
                        />
                    </div>
                )}

                {/* Stats Grid - PATIENT VIEW */}
                {!isDoctor && (
                    <div className="profile-stats-grid">
                        <StatCard 
                            icon={Droplets} 
                            label="Blood Group" 
                            value={user?.blood_group || '—'} 
                            color="#EF4444" 
                            bg="rgba(239,68,68,0.08)" 
                        />
                        <StatCard 
                            icon={Ruler} 
                            label="Height (cm)" 
                            value={user?.height || '—'} 
                            color="#0066CC" 
                            bg="rgba(0,102,204,0.08)" 
                        />
                        <StatCard 
                            icon={Scale} 
                            label="Weight (kg)" 
                            value={user?.weight || '—'} 
                            color="#7C3AED" 
                            bg="rgba(124,58,237,0.08)" 
                        />
                        <StatCard 
                            icon={Users} 
                            label="Gender" 
                            value={user?.gender || '—'} 
                            color="#F59E0B" 
                            bg="rgba(245,158,11,0.08)" 
                        />
                    </div>
                )}

                {/* Information Card */}
                <div className="profile-info-card">
                    <div className="profile-info-row">
                        <div className="profile-info-icon"><Mail size={20} color="#0066CC" /></div>
                        <div className="profile-info-content">
                            <span className="label">Email</span>
                            <span className="value">{user?.email}</span>
                        </div>
                    </div>
                    <div className="profile-info-divider" />
                    <div className="profile-info-row">
                        <div className="profile-info-icon"><Phone size={20} color="#0066CC" /></div>
                        <div className="profile-info-content">
                            <span className="label">Phone</span>
                            <span className="value">{user?.phone}</span>
                        </div>
                    </div>
                    <div className="profile-info-divider" />
                    <div className="profile-info-row">
                        <div className="profile-info-icon"><Calendar size={20} color="#0066CC" /></div>
                        <div className="profile-info-content">
                            <span className="label">Date of Birth</span>
                            <span className="value">{user?.dob || 'Not set'}</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="profile-actions">
                    <button className="profile-edit-btn" onClick={() => setEditing(true)}>
                        <Edit2 size={18} /> Edit Profile
                    </button>
                    
                    {isDoctor && (
                        <div className="profile-availability">
                            <div className="availability-info">
                                <span className="label">Availability Status</span>
                                <span className="sub">Available for consultations</span>
                            </div>
                            <label className="premium-switch">
                                <input type="checkbox" checked={isAvailable} onChange={() => setIsAvailable(!isAvailable)} />
                                <span className="premium-switch__slider"></span>
                            </label>
                        </div>
                    )}
                </div>
            </div>

            {/* Edit Modal */}
            {editing && (
                <div className="profile-modal-overlay">
                    <div className="profile-modal">
                        <h3>Edit Profile</h3>
                        <div className="modal-form">
                            <div className="form-group">
                                <label>Name</label>
                                <input className={fieldErrors.name ? 'input-error' : ''} value={name} onChange={e => setName(e.target.value)} />
                                {fieldErrors.name && <span className="error-text">{fieldErrors.name}</span>}
                            </div>
                            <div className="modal-row">
                                <div className="form-group">
                                    <label>Email</label>
                                    <input className={fieldErrors.email ? 'input-error' : ''} value={email} onChange={e => setEmail(e.target.value)} />
                                    {fieldErrors.email && <span className="error-text">{fieldErrors.email}</span>}
                                </div>
                                <div className="form-group">
                                    <label>Phone</label>
                                    <input className={fieldErrors.phone ? 'input-error' : ''} value={phone} onChange={e => setPhone(e.target.value)} />
                                    {fieldErrors.phone && <span className="error-text">{fieldErrors.phone}</span>}
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Date of Birth</label>
                                <input type="date" className={fieldErrors.dob ? 'input-error' : ''} value={dob} onChange={e => setDob(e.target.value)} />
                                {fieldErrors.dob && <span className="error-text">{fieldErrors.dob}</span>}
                            </div>

                            {!isDoctor && (
                                <>
                                    <div className="modal-row">
                                        <div className="form-group">
                                            <label>Gender</label>
                                            <select value={gender} onChange={e => setGender(e.target.value)}>
                                                <option value="">Select</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                                <option value="Other">Other</option>
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label>Blood Group</label>
                                            <input value={bloodGroup} onChange={e => setBloodGroup(e.target.value)} placeholder="e.g. O+" />
                                        </div>
                                    </div>
                                    <div className="modal-row">
                                        <div className="form-group">
                                            <label>Height (cm)</label>
                                            <input type="number" className={fieldErrors.height ? 'input-error' : ''} value={height} onChange={e => setHeight(e.target.value)} />
                                            {fieldErrors.height && <span className="error-text">{fieldErrors.height}</span>}
                                        </div>
                                        <div className="form-group">
                                            <label>Weight (kg)</label>
                                            <input type="number" className={fieldErrors.weight ? 'input-error' : ''} value={weight} onChange={e => setWeight(e.target.value)} />
                                            {fieldErrors.weight && <span className="error-text">{fieldErrors.weight}</span>}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                        <div className="modal-buttons">
                            <button className="cancel-link" onClick={() => setEditing(false)}>Cancel</button>
                            <GradientButton onClick={handleSave} isLoading={isSaving}>Save Changes</GradientButton>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
