import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { 
    Calendar, Clock, User, MessageSquare, Plus, ChevronRight, 
    CheckCircle2, XCircle, Clock4, Check, AlertTriangle,
    Heart, Activity, Thermometer, Brain, PhoneCall, BookOpen, Send, ShieldAlert,
    Star, Award, GraduationCap, MapPin, Globe, CheckCircle
} from 'lucide-react';
import GradientButton from '../components/GradientButton';
import './DoctorPage.css';

export default function DoctorPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [appointments, setAppointments] = useState([]);
    const [latestVitals, setLatestVitals] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showBookingModal, setShowBookingModal] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);
    const [appointmentToCancel, setAppointmentToCancel] = useState(null);
    const [selectedDoctor, setSelectedDoctor] = useState(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [profileDoctor, setProfileDoctor] = useState(null);
    
    // Sharing state
    const [includeHistory, setIncludeHistory] = useState(true);
    const [message, setMessage] = useState('');
    const [isSharing, setIsSharing] = useState(false);
    const [shareSuccess, setShareSuccess] = useState(false);

    // Form state for booking
    const [bookingDate, setBookingDate] = useState('');
    const [bookingTime, setBookingTime] = useState('09:00 AM');
    const [bookingReason, setBookingReason] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancellingId, setCancellingId] = useState(null);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user?.id]);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const [docsData, apptsData, vitalsData] = await Promise.all([
                api.fetchDoctors(),
                api.fetchAppointments(user.id),
                api.fetchVitals(user.id)
            ]);
            
            setDoctors(Array.isArray(docsData) ? docsData : []);
            setAppointments(Array.isArray(apptsData) ? apptsData : []);
            
            const rows = Array.isArray(vitalsData) ? vitalsData : (vitalsData?.data || []);
            if (rows.length > 0) {
                setLatestVitals(rows[0]);
            }
        } catch (err) {
            console.error('Error loading connect page data:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShareVitals = async () => {
        if (!selectedDoctor) {
            // If no doctor selected, show toast or simple alert
            alert("Please select a doctor to share with from the booking modal first, or we can implement a doctor picker here.");
            setShowBookingModal(true); // Fallback to let them pick a doctor
            return;
        }

        setIsSharing(true);
        try {
            await api.shareVitals(user.id, selectedDoctor.id, {
                message,
                includeHistory
            });
            setShareSuccess(true);
            setTimeout(() => setShareSuccess(false), 3000);
            setMessage('');
        } catch (err) {
            alert('Failed to share: ' + err.message);
        } finally {
            setIsSharing(false);
        }
    };

    const handleBookAppointment = async () => {
        if (!selectedDoctor || !bookingDate) return;

        setIsSubmitting(true);
        try {
            const result = await api.request('/appointments.php', {
                method: 'POST',
                body: JSON.stringify({
                    patient_id: user.id,
                    doctor_id: selectedDoctor.id,
                    appointment_date: bookingDate,
                    appointment_time: bookingTime,
                    reason: bookingReason,
                    status: 'scheduled'
                })
            });

            if (result.success) {
                setShowBookingModal(false);
                setBookingDate('');
                setBookingReason('');
                loadData();
            }
        } catch (err) {
            alert('Failed to book: ' + err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const confirmCancellation = async () => {
        if (!appointmentToCancel) return;
        setCancellingId(appointmentToCancel.id);
        setShowCancelConfirm(false);
        try {
            await api.updateAppointmentStatus(appointmentToCancel.id, 'cancelled');
            loadData();
        } catch (err) {
            alert('Failed to cancel: ' + err.message);
        } finally {
            setCancellingId(null);
            setAppointmentToCancel(null);
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed': return <CheckCircle2 size={16} className="status-icon--completed" />;
            case 'cancelled': return <XCircle size={16} className="status-icon--cancelled" />;
            default: return <Clock4 size={16} className="status-icon--pending" />;
        }
    };

    if (isLoading) {
        return <div className="doctor-page__loading"><div className="vitals-spinner" /></div>;
    }

    return (
        <div className="doctor-page">
            <div className="doctor-page__header">
                <h1>Connect</h1>
            </div>

            {/* Vitals Summary Card (iOS Style) */}
            <div className="connect-vitals">
                <div className="connect-vitals__item">
                    <Heart size={20} color="#EC4899" />
                    <div className="connect-vitals__info">
                        <span className="connect-vitals__label">Heart Rate</span>
                        <span className="connect-vitals__value">{latestVitals?.heart_rate ? `${latestVitals.heart_rate} bpm` : 'Not recorded'}</span>
                    </div>
                </div>
                <div className="connect-vitals__item">
                    <Activity size={20} color="#7C3AED" />
                    <div className="connect-vitals__info">
                        <span className="connect-vitals__label">Blood Pressure</span>
                        <span className="connect-vitals__value">{latestVitals?.blood_pressure || (latestVitals?.bp_systolic ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}` : 'Not recorded')}</span>
                    </div>
                </div>
                <div className="connect-vitals__item">
                    <Thermometer size={20} color="#F59E0B" />
                    <div className="connect-vitals__info">
                        <span className="connect-vitals__label">Temperature</span>
                        <span className="connect-vitals__value">{latestVitals?.temperature ? `${latestVitals.temperature}°C` : 'Not recorded'}</span>
                    </div>
                </div>
            </div>

            {/* Share Section */}
            <div className="connect-share">
                <div className="connect-share__history">
                    <span>Include 7-day history</span>
                    <label className="ios-switch">
                        <input type="checkbox" checked={includeHistory} onChange={() => setIncludeHistory(!includeHistory)} />
                        <span className="ios-switch__slider"></span>
                    </label>
                </div>

                <div className="connect-share__message">
                    <h3>Add a Message (Optional)</h3>
                    <textarea 
                        placeholder="Describe any symptoms or concerns..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                </div>

                <button 
                    className={`connect-share__btn ${shareSuccess ? 'connect-share__btn--success' : ''}`}
                    onClick={handleShareVitals}
                    disabled={isSharing}
                >
                    {isSharing ? 'Sharing...' : shareSuccess ? <><Check size={18} /> Shared with Doctor</> : <><Send size={18} /> Share with Doctor</>}
                </button>
            </div>

            {/* Quick Actions Grid */}
            <div className="connect-actions">
                <h3>Quick Actions</h3>
                <div className="connect-actions__grid">
                    <button className="action-tile" onClick={() => navigate('/dashboard/ai-risk')}>
                        <div className="action-tile__icon action-tile__icon--blue"><Brain size={24} /></div>
                        <span>AI Analysis</span>
                    </button>
                    <button className="action-tile" onClick={() => alert("Simulating Emergency SOS signal to nearest hospital...")}>
                        <div className="action-tile__icon action-tile__icon--red"><ShieldAlert size={24} /></div>
                        <span>Emergency SOS</span>
                    </button>
                    <button className="action-tile" onClick={() => { setSelectedDoctor(doctors[0]); setShowBookingModal(true); }}>
                        <div className="action-tile__icon action-tile__icon--orange"><Calendar size={24} /></div>
                        <span>Schedule Visit</span>
                    </button>
                    <button className="action-tile" onClick={() => navigate('/dashboard/history')}>
                        <div className="action-tile__icon action-tile__icon--green"><BookOpen size={24} /></div>
                        <span>Vitals Guide</span>
                    </button>
                </div>
            </div>

            {/* Available Doctors Grid */}
            <section className="doctor-page__section">
                <div className="section-header">
                    <h3>Available Specialists</h3>
                </div>
                <div className="doctors-grid">
                    {doctors.map(doc => {
                        const profData = {
                            experience: "12+ Years",
                            patients: "500+",
                            rating: "4.9",
                            bio: `Dr. ${doc.name} is a distinguished specialist in respiratory health with extensive experience in clinical care and advanced diagnostics.`,
                            education: ["MD - Respiratory Medicine", "Board Certified Specialist"],
                            ...doc.professional // Use real data if exists
                        };
                        
                        return (
                            <div key={doc.id} className="doctor-card">
                                <div className="doctor-card__avatar">
                                    {doc.photo_url ? <img src={api.getPhotoUrl(doc.photo_url)} alt={doc.name} /> : <User size={32} />}
                                </div>
                                <div className="doctor-card__info">
                                    <span className="doctor-card__name">Dr. {doc.name}</span>
                                    <span className="doctor-card__specialty">Pulmonology Specialist</span>
                                </div>
                                
                                <div className="doctor-card__stats">
                                    <div className="doctor-card__stat">
                                        <span className="doctor-card__stat-val">{profData.experience}</span>
                                        <span className="doctor-card__stat-label">Exp.</span>
                                    </div>
                                    <div className="doctor-card__stat">
                                        <span className="doctor-card__stat-val" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                                            <Star size={12} fill="#F59E0B" color="#F59E0B" /> {profData.rating}
                                        </span>
                                        <span className="doctor-card__stat-label">Rating</span>
                                    </div>
                                    <div className="doctor-card__stat">
                                        <span className="doctor-card__stat-val">{profData.patients}</span>
                                        <span className="doctor-card__stat-label">Patients</span>
                                    </div>
                                </div>

                                <div className="doctor-card__actions">
                                    <button 
                                        className="doctor-card__btn doctor-card__btn--secondary"
                                        onClick={() => {
                                            setProfileDoctor({...doc, ...profData});
                                            setShowProfileModal(true);
                                        }}
                                    >
                                        Profile
                                    </button>
                                    <button 
                                        className="doctor-card__btn"
                                        onClick={() => {
                                            setSelectedDoctor(doc);
                                            setShowBookingModal(true);
                                        }}
                                    >
                                        Book
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* My Appointments List */}
            <section className="doctor-page__section">
                <div className="section-header" onClick={() => navigate('/dashboard/appointments')} style={{ cursor: 'pointer' }}>
                    <h3>My Appointments</h3>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.9rem' }}>
                        View All <ChevronRight size={18} />
                    </div>
                </div>
                <div className="appointments-list">
                    {appointments.length > 0 ? (
                        appointments.filter(appt => !['cancelled', 'declined'].includes(appt.status)).slice(0, 3).map(appt => (
                            <div 
                                key={appt.id} 
                                className="appointment-item appointment-item--clickable"
                                onClick={() => navigate('/dashboard/appointments')}
                            >
                                <div className="appointment-item__status-dot" style={{ backgroundColor: appt.status === 'scheduled' || appt.status === 'pending' ? '#F59E0B' : '#10B981' }} />
                                <div className="appointment-item__avatar">
                                    {appt.doctor_photo ? <img src={api.getPhotoUrl(appt.doctor_photo)} alt={appt.doctor_name} /> : <User size={20} />}
                                </div>
                                <div className="appointment-item__info">
                                    <span className="appointment-item__doctor">Dr. {appt.doctor_name}</span>
                                    <span className="appointment-item__time">{appt.appointment_date} • {appt.appointment_time}</span>
                                </div>
                                <div className="appointment-item__action">
                                    <ChevronRight size={18} />
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="doctor-page__empty">
                            <Calendar size={40} />
                            <p>View and manage your bookings</p>
                        </div>
                    )}
                </div>
            </section>

            {/* Reuse Booking Modal from existing code */}
            {showBookingModal && (
                <div className="doctor-page__modal-overlay" onClick={() => setShowBookingModal(false)}>
                    <div className="doctor-page__modal" onClick={e => e.stopPropagation()}>
                        <h3>Select Provider</h3>
                        <div className="modal-field">
                            <label className="modal-label">Choose Doctor</label>
                            <select 
                                className="modal-select"
                                value={selectedDoctor?.id || ''}
                                onChange={(e) => setSelectedDoctor(doctors.find(d => d.id === parseInt(e.target.value)))}
                            >
                                <option value="">Select a doctor...</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>Dr. {d.name}</option>)}
                            </select>
                        </div>
                        
                        {selectedDoctor && (
                            <div className="modal-grid">
                                <div className="modal-field">
                                    <label className="modal-label">Date</label>
                                    <input type="date" className="modal-input" value={bookingDate} onChange={e => setBookingDate(e.target.value)} />
                                </div>
                                <div className="modal-field">
                                    <label className="modal-label">Time Slot</label>
                                    <select className="modal-select" value={bookingTime} onChange={e => setBookingTime(e.target.value)}>
                                        <option>09:00 AM</option>
                                        <option>10:00 AM</option>
                                        <option>11:00 AM</option>
                                        <option>02:00 PM</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button className="modal-btn--cancel" onClick={() => setShowBookingModal(false)}>Back</button>
                            <GradientButton onClick={handleBookAppointment} disabled={isSubmitting || !selectedDoctor || !bookingDate}>
                                {isSubmitting ? 'Booking...' : 'Confirm'}
                            </GradientButton>
                        </div>
                    </div>
                </div>
            )}
            {/* Doctor Professional Profile Modal */}
            {showProfileModal && profileDoctor && (
                <div className="prof-modal__overlay" onClick={() => setShowProfileModal(false)}>
                    <div className="prof-modal" onClick={e => e.stopPropagation()}>
                        <div className="prof-modal__close" onClick={() => setShowProfileModal(false)}>
                            <XCircle size={24} />
                        </div>
                        
                        <div className="prof-modal__hero">
                            <div className="prof-modal__avatar-container">
                                {profileDoctor.photo_url ? (
                                    <img src={api.getPhotoUrl(profileDoctor.photo_url)} alt={profileDoctor.name} className="prof-modal__avatar" />
                                ) : (
                                    <div className="prof-modal__avatar" style={{ background: 'var(--bg-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={60} color="var(--text-muted)" />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="prof-modal__content">
                            <div className="prof-modal__header">
                                <div className="prof-modal__name-box">
                                    <h2>Dr. {profileDoctor.name}</h2>
                                    <div className="prof-modal__verified">
                                        <CheckCircle size={16} fill="#0066CC" color="#fff" />
                                        Verified Specialist
                                    </div>
                                </div>
                                <GradientButton onClick={() => {
                                    setSelectedDoctor(profileDoctor);
                                    setShowProfileModal(false);
                                    setShowBookingModal(true);
                                }}>
                                    Book Appointment
                                </GradientButton>
                            </div>

                            <div className="prof-modal__stats">
                                <div className="prof-modal__stat">
                                    <span className="prof-modal__stat-val">{profileDoctor.experience}</span>
                                    <span className="prof-modal__stat-label">Experience</span>
                                </div>
                                <div className="prof-modal__stat">
                                    <span className="prof-modal__stat-val">{profileDoctor.rating}</span>
                                    <span className="prof-modal__stat-label">Rating</span>
                                </div>
                                <div className="prof-modal__stat">
                                    <span className="prof-modal__stat-val">{profileDoctor.patients}</span>
                                    <span className="prof-modal__stat-label">Patients</span>
                                </div>
                            </div>

                            <div className="prof-modal__section">
                                <h3>About</h3>
                                <p className="prof-modal__bio">{profileDoctor.bio}</p>
                            </div>

                            <div className="prof-modal__section">
                                <h3>Education & Qualifications</h3>
                                <div className="prof-modal__list">
                                    {profileDoctor.education.map((item, index) => (
                                        <div key={index} className="prof-modal__list-item">
                                            <GraduationCap size={18} color="var(--color-primary)" />
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                    <div className="prof-modal__list-item">
                                        <Award size={18} color="var(--color-primary)" />
                                        <span>Certified Pulmonologist</span>
                                    </div>
                                </div>
                            </div>

                            <div className="prof-modal__section">
                                <h3>Contact Information</h3>
                                <div className="prof-modal__list">
                                    <div className="prof-modal__list-item">
                                        <MapPin size={18} color="var(--color-primary)" />
                                        <span>Respire Medical Center, Main Block</span>
                                    </div>
                                    <div className="prof-modal__list-item">
                                        <Globe size={18} color="var(--color-primary)" />
                                        <span>English, Telugu, Hindi</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
