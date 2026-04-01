import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Users, AlertTriangle, Bell, Calendar, Brain,
    ChevronRight, CheckCircle2, Heart, Wind
} from 'lucide-react';
import './DoctorHomePage.css';

export default function DoctorHomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [summary, setSummary] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

    useEffect(() => {
        loadDashboard();
        const interval = setInterval(loadDashboard, 15000);
        return () => clearInterval(interval);
    }, []);

    const loadDashboard = async () => {
        setIsLoading(true);
        try {
            const data = await api.fetchDoctorDashboard(user?.id);
            setSummary(data);
        } catch (err) {
            console.error('Failed to load doctor dashboard:', err);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return <div className="doctor-home__loading">Loading dashboard...</div>;
    }

    const stats = [
        { label: 'Total Patients', value: summary?.stats?.total_patients || 0, icon: Users, color: '#0066CC', bg: 'rgba(0,102,204,0.1)', path: '/dashboard/patients' },
        { label: 'Critical Risk', value: summary?.stats?.critical_patients || 0, icon: AlertTriangle, color: '#EF4444', bg: 'rgba(239,68,68,0.1)', path: '/dashboard/patients?filter=critical' },
        { label: 'Pending Alerts', value: summary?.stats?.pending_alerts || 0, icon: Bell, color: '#F59E0B', bg: 'rgba(245,158,11,0.1)', path: '/dashboard/alerts' },
        { label: "Upcoming", value: summary?.stats?.today_appointments || 0, icon: Calendar, color: '#7C3AED', bg: 'rgba(124,58,237,0.1)', path: '/dashboard/appointments' },
    ];

    return (
        <div className="doctor-home">
            <header className="doctor-home__header">
                <div>
                    <span className="doctor-home__greeting">{greeting},</span>
                    <h1 className="doctor-home__name">Dr. {user?.name || 'Physician'} 👋</h1>
                </div>
            </header>

            {/* Stats Row */}
            <div className="doctor-home__stats">
                {stats.map((stat, i) => (
                    <button key={i} className="doctor-home__stat-card" onClick={() => navigate(stat.path)}>
                        <div className="doctor-home__stat-icon" style={{ background: stat.bg, color: stat.color }}>
                            <stat.icon size={20} />
                        </div>
                        <div className="doctor-home__stat-info">
                            <span className="doctor-home__stat-value">{stat.value}</span>
                            <span className="doctor-home__stat-label">{stat.label}</span>
                        </div>
                    </button>
                ))}
            </div>

            {/* Today's Schedule Section */}
            <section className="doctor-home__section">
                <div className="doctor-home__section-header">
                    <h3>Today's Schedule</h3>
                    <button onClick={() => navigate('/dashboard/appointments')}>View All</button>
                </div>
                <div className="doctor-home__appointments-list">
                    {summary?.today_appointments_list?.length > 0 ? (
                        summary.today_appointments_list.map(appt => (
                            <div 
                                key={appt.id} 
                                className="doctor-home__appointment-row"
                                onClick={() => navigate('/dashboard/appointments')}
                            >
                                <div className="doctor-home__appt-time">{appt.appointment_time}</div>
                                <div className="doctor-home__appt-info">
                                    <span className="patient-name">{appt.patient_name}</span>
                                    <span className="reason">{appt.reason || 'General Consultation'}</span>
                                </div>
                                <ChevronRight className="doctor-home__next-arrow" size={16} />
                            </div>
                        ))
                    ) : (
                        <div className="doctor-home__empty-card">
                            <Calendar size={24} />
                            <span>No appointments scheduled for today.</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Recently Shared Vitals */}
            <section className="doctor-home__section">
                <div className="doctor-home__section-header">
                    <h3>Recently Shared Vitals</h3>
                    <div className="shared-count">{summary?.recently_shared_vitals?.length || 0} New</div>
                </div>
                <div className="doctor-home__shared-vitals-grid">
                    {summary?.recently_shared_vitals?.length > 0 ? (
                        summary.recently_shared_vitals.map(vital => (
                            <div 
                                key={vital.patient_id} 
                                className="shared-vital-card clickable" 
                                onClick={() => navigate(`/dashboard/patients/${vital.patient_id}`)}
                            >
                                <span className="patient-name">{vital.patient_name}</span>
                                <div className="vital-stats">
                                    <div className="stat">
                                        <Wind size={14} color="#0066CC" />
                                        <span>{vital.spo2}%</span>
                                    </div>
                                    <div className="stat">
                                        <Heart size={14} color="#EC4899" />
                                        <span>{vital.heart_rate}</span>
                                    </div>
                                </div>
                                <span className="shared-time">Shared recently</span>
                            </div>
                        ))
                    ) : (
                        <div className="doctor-home__empty-card">
                            <span>No vitals shared recently.</span>
                        </div>
                    )}
                </div>
            </section>

            {/* Priority Patients */}
            <section className="doctor-home__section">
                <div className="doctor-home__section-header">
                    <h3>Priority Patients</h3>
                    <button onClick={() => navigate('/dashboard/patients')}>Manage List</button>
                </div>
                <div className="doctor-home__priority-list">
                    {summary?.priority_patients?.length > 0 ? (
                        summary.priority_patients.map(patient => (
                            <div key={patient.id} className="priority-item">
                                <div className={`priority-item__status priority-item__status--${patient.risk_level.toLowerCase().replace(' ', '-')}`}></div>
                                <div className="priority-item__info">
                                    <span className="name">{patient.name}</span>
                                    <span className="risk">{patient.risk_level}</span>
                                </div>
                                <div className="priority-item__vitals">
                                    <div className="vital">
                                        <Wind size={12} style={{ color: '#0066CC' }} />
                                        <span>{patient.spo2}% SpO₂</span>
                                    </div>
                                    <div className="vital">
                                        <Heart size={12} style={{ color: '#EC4899' }} />
                                        <span>{patient.heart_rate} BPM</span>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="priority-item__arrow" />
                            </div>
                        ))
                    ) : (
                        <div className="doctor-home__empty-card success">
                            <CheckCircle2 size={24} style={{ color: '#10B981' }} />
                            <span>Stability maintained across all patients.</span>
                        </div>
                    )}
                </div>
            </section>

            {/* AI Monitoring Status */}
            <div className="doctor-home__ai-card" onClick={() => navigate('/dashboard/patients?filter=critical')} style={{ cursor: 'pointer' }}>
                <div className="doctor-home__ai-icon" style={{ background: 'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)', color: 'white' }}>
                    <Brain size={24} />
                </div>
                <div className="doctor-home__ai-info">
                    <h4>AI Patient Monitoring</h4>
                    <p>Real-time respiratory risk tracking is active for all assigned patients.</p>
                </div>
                <div className="doctor-home__ai-status">
                    <div className="status-dot"></div>
                    Live
                </div>
                <ChevronRight size={20} className="doctor-home__ai-arrow" />
            </div>
        </div>
    );
}
