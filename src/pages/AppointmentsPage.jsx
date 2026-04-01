import { useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Calendar, Clock, User, CheckCircle2,
    XCircle, MoreHorizontal, CalendarDays,
    ArrowRight, MessageSquare, MapPin
} from 'lucide-react';
import './AppointmentsPage.css';

export default function AppointmentsPage() {
    const { user } = useAuth();
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('upcoming'); // upcoming, completed, cancelled
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(null);

    useEffect(() => {
        const handleClickOutside = () => setDropdownOpen(null);
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    useEffect(() => {
        if (user?.id) {
            loadAppointments();
            const interval = setInterval(loadAppointments, 30000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            const data = user.role === 'doctor' 
                ? await api.fetchDoctorAppointments(user.id)
                : await api.fetchAppointments(user.id, 'patient');
            setAppointments(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load appointments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async (id, status) => {
        try {
            await api.updateAppointmentStatus(id, status);
            // Optimistic update
            setAppointments(appointments.map(a => a.id === id ? { ...a, status } : a));
        } catch (error) {
            console.error('Failed to update status:', error);
        }
    };

    const filteredAppointments = appointments.filter(a => {
        if (filter === 'upcoming') return a.status === 'scheduled';
        if (filter === 'onworking') return a.status === 'confirmed';
        if (filter === 'completed') return a.status === 'completed';
        if (filter === 'cancelled') return a.status === 'cancelled';
        return true;
    });

    const getStatusColor = (status) => {
        switch (status) {
            case 'scheduled': return '#3B82F6';
            case 'confirmed': return '#8B5CF6';
            case 'completed': return '#10B981';
            case 'cancelled': return '#EF4444';
            default: return '#64748B';
        }
    };

    return (
        <div className="appointments-page">
            <header className="appointments-page__header">
                <div className="appointments-page__header-info">
                    <h1 className="appointments-page__title">{user.role === 'doctor' ? 'Your Schedule' : 'My Appointments'}</h1>
                    <p className="appointments-page__subtitle">
                        {user.role === 'doctor' 
                            ? 'Manage your patient consultations and daily clinical workflow'
                            : 'View and manage your upcoming consultations with healthcare providers'}
                    </p>
                </div>
                <div className="appointments-page__header-actions">
                    <button className="calendar-btn">
                        <CalendarDays size={20} />
                        View Calendar
                    </button>
                </div>
            </header>

            <nav className="appointments-tabs">
                <button
                    className={`nav-tab ${filter === 'upcoming' ? 'nav-tab--active' : ''}`}
                    onClick={() => setFilter('upcoming')}
                >
                    Upcoming 
                    <span className="tab-count">
                        {user.role === 'doctor' 
                            ? appointments.filter(a => a.status === 'scheduled').length
                            : appointments.filter(a => ['scheduled', 'pending', 'confirmed'].includes(a.status)).length
                        }
                    </span>
                </button>
                <button
                    className={`nav-tab ${filter === 'onworking' ? 'nav-tab--active' : ''}`}
                    onClick={() => setFilter('onworking')}
                >
                    {user.role === 'doctor' ? 'Ongoing' : 'In Progress'}
                    <span className="tab-count">
                        {appointments.filter(a => ['confirmed', 'ongoing', 'in_progress'].includes(a.status)).length}
                    </span>
                </button>
                <button
                    className={`nav-tab ${filter === 'completed' ? 'nav-tab--active' : ''}`}
                    onClick={() => setFilter('completed')}
                >
                    Completed
                </button>
                <button
                    className={`nav-tab ${filter === 'cancelled' ? 'nav-tab--active' : ''}`}
                    onClick={() => setFilter('cancelled')}
                >
                    Cancelled
                </button>
            </nav>

            {loading ? (
                <div className="appointments-loading">
                    <div className="shimmer-card"></div>
                    <div className="shimmer-card"></div>
                    <div className="shimmer-card"></div>
                </div>
            ) : filteredAppointments.length === 0 ? (
                <div className="appointments-empty">
                    <Calendar size={48} className="empty-icon" />
                    <h3>No {filter} appointments</h3>
                    <p>Your schedule for this category is currently empty.</p>
                </div>
            ) : (
                <div className="appointments-list">
                    {filteredAppointments.map(appt => (
                        <div key={appt.id} className="appt-card">
                            <div className="appt-card__time-col">
                                <span className="appt-card__time">{appt.appointment_time}</span>
                                <span className="appt-card__date">{new Date(appt.appointment_date).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                            </div>

                            <div className="appt-card__content">
                                <div className="appt-card__top">
                                    <div className="appt-card__patient">
                                        <div className="appt-card__avatar" style={{ 
                                            background: user.role === 'doctor' ? '' : 'linear-gradient(135deg, #10B981, #3B82F6)'
                                        }}>
                                            {user.role === 'doctor' ? (
                                                appt.patient_photo ? (
                                                    <img src={api.getPhotoUrl(appt.patient_photo)} alt={appt.patient_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                ) : (
                                                    appt.patient_name?.[0] || 'P'
                                                )
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="appt-card__patient-info">
                                            <h3 className="appt-card__patient-name">
                                                {user.role === 'doctor' ? appt.patient_name : (appt.doctor_name || 'Dr. Health Specialist')}
                                            </h3>
                                            <span className="appt-card__type">Online Consultation</span>
                                        </div>
                                    </div>
                                    <div className="appt-status-chip" style={{ backgroundColor: `${getStatusColor(appt.status)}15`, color: getStatusColor(appt.status) }}>
                                        <div className="status-dot" style={{ backgroundColor: getStatusColor(appt.status) }}></div>
                                        {appt.status}
                                    </div>
                                </div>

                                <div className="appt-card__details">
                                    <div className="appt-detail">
                                        <MessageSquare size={14} />
                                        <span>{appt.reason || 'Routine checkup'}</span>
                                    </div>
                                    <div className="appt-detail">
                                        <MapPin size={14} />
                                        <span>Virtual Room-4</span>
                                    </div>
                                </div>

                                <div className="appt-card__footer">
                                    {user.role === 'patient' ? (
                                        <>
                                            {appt.status === 'scheduled' || appt.status === 'pending' || appt.status === 'confirmed' ? (
                                                <button
                                                    className="btn-cancel-large"
                                                    onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                                >
                                                    <XCircle size={18} /> Cancel Appointment
                                                </button>
                                            ) : (
                                                <button 
                                                    className="btn-secondary"
                                                    onClick={() => setSelectedAppt(appt)}
                                                >
                                                    View Summary <ArrowRight size={14} />
                                                </button>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {appt.status === 'scheduled' ? (
                                                <div className="appt-actions">
                                                    <button
                                                        className="btn-complete"
                                                        onClick={() => handleUpdateStatus(appt.id, 'confirmed')}
                                                    >
                                                        <CheckCircle2 size={16} /> Accept
                                                    </button>
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                                    >
                                                        <XCircle size={16} /> Decline
                                                    </button>
                                                </div>
                                            ) : appt.status === 'confirmed' ? (
                                                <div className="appt-actions">
                                                    <button
                                                        className="btn-complete"
                                                        onClick={() => handleUpdateStatus(appt.id, 'completed')}
                                                    >
                                                        <CheckCircle2 size={16} /> Done
                                                    </button>
                                                    <button
                                                        className="btn-cancel"
                                                        onClick={() => handleUpdateStatus(appt.id, 'cancelled')}
                                                    >
                                                        <XCircle size={16} /> Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button 
                                                    className="btn-secondary"
                                                    onClick={() => setSelectedAppt(appt)}
                                                >
                                                    View Summary <ArrowRight size={14} />
                                                </button>
                                            )}
                                        </>
                                    )}
                                    <div style={{ position: 'relative' }}>
                                        <button 
                                            className="btn-more"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setDropdownOpen(dropdownOpen === appt.id ? null : appt.id);
                                            }}
                                        >
                                            <MoreHorizontal size={18} />
                                        </button>
                                        
                                        {dropdownOpen === appt.id && (
                                            <div className="appt-dropdown-menu">
                                                <button className="dropdown-item">View Patient Profile</button>
                                                <button className="dropdown-item">Download Report</button>
                                                <button className="dropdown-item">Message Patient</button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* View Summary Modal */}
            {selectedAppt && (
                <div className="appt-modal-overlay" onClick={() => setSelectedAppt(null)}>
                    <div className="appt-modal" onClick={e => e.stopPropagation()}>
                        <div className="appt-modal-header">
                            <h2>Consultation Summary</h2>
                            <button className="btn-close-modal" onClick={() => setSelectedAppt(null)}>
                                <XCircle size={24} />
                            </button>
                        </div>
                        <div className="appt-modal-body">
                            <div className="appt-modal-patient">
                                <div className="appt-modal-avatar">
                                    {selectedAppt.patient_photo ? (
                                        <img src={api.getPhotoUrl(selectedAppt.patient_photo)} alt={selectedAppt.patient_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        selectedAppt.patient_name?.[0] || 'P'
                                    )}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{selectedAppt.patient_name}</h3>
                                    <p style={{ margin: '4px 0 0 0', color: 'var(--text-muted)' }}>
                                        {new Date(selectedAppt.appointment_date).toLocaleDateString()} at {selectedAppt.appointment_time}
                                    </p>
                                </div>
                            </div>
                            
                            <div className="appt-modal-details">
                                <div className="modal-detail-row">
                                    <span className="modal-detail-label">Status</span>
                                    <span className="appt-status-chip inline" style={{ backgroundColor: `${getStatusColor(selectedAppt.status)}15`, color: getStatusColor(selectedAppt.status), display: 'inline-flex' }}>
                                        <div className="status-dot" style={{ backgroundColor: getStatusColor(selectedAppt.status) }}></div>
                                        {selectedAppt.status}
                                    </span>
                                </div>
                                <div className="modal-detail-row">
                                    <span className="modal-detail-label">Reason</span>
                                    <span className="modal-detail-value">{selectedAppt.reason || 'Routine checkup'}</span>
                                </div>
                                <div className="modal-detail-row">
                                    <span className="modal-detail-label">Diagnosis</span>
                                    <p className="modal-detail-box">{selectedAppt.diagnosis || 'Healthy. Continue with regular wellness activities and follow prescribed health plan.'}</p>
                                </div>
                                <div className="modal-detail-row">
                                    <span className="modal-detail-label">Prescription / Notes</span>
                                    <p className="modal-detail-box">{selectedAppt.notes || 'Patient reported feeling well. No significant medical concerns. Regular monitoring advised.'}</p>
                                </div>
                            </div>
                        </div>
                        <div className="appt-modal-footer">
                            <button className="btn-complete" onClick={() => setSelectedAppt(null)}>Close Summary</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
