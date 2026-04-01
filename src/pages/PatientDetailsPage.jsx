import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
    Heart, Wind, Thermometer, Activity, Droplet,
    ChevronLeft, Calendar, User, Clock, AlertCircle,
    TrendingUp, ArrowLeft
} from 'lucide-react';
import './PatientDetailsPage.css';

export default function PatientDetailsPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [patient, setPatient] = useState(null);
    const [vitals, setVitals] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            loadPatientData(true);
            const interval = setInterval(() => loadPatientData(false), 30000);
            return () => clearInterval(interval);
        }
    }, [id]);

    const loadPatientData = async (showLoading = true) => {
        try {
            if (showLoading) setLoading(true);
            const [patientData, vitalsData] = await Promise.all([
                api.fetchPatient(id),
                api.fetchVitals(id)
            ]);
            setPatient(patientData);
            setVitals(Array.isArray(vitalsData) ? vitalsData : (vitalsData?.data || []));
        } catch (error) {
            console.error('Failed to load patient data:', error);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="patient-details--loading">
                <div className="spinner"></div>
                <p>Retrieving clinical data...</p>
            </div>
        );
    }

    if (!patient) {
        return (
            <div className="patient-details--error">
                <AlertCircle size={48} />
                <h3>Patient not found</h3>
                <button onClick={() => navigate('/dashboard/patients')}>Back to Directory</button>
            </div>
        );
    }

    const latestVitals = vitals[0] || {};

    const getRiskBadgeClass = (risk) => {
        const r = risk?.toLowerCase() || '';
        if (r.includes('critical') || r.includes('high')) return 'risk-badge--critical';
        if (r.includes('moderate') || r.includes('medium')) return 'risk-badge--moderate';
        return 'risk-badge--stable';
    };

    return (
        <div className="patient-details">
            <header className="patient-details__header">
                <button className="back-btn" onClick={() => navigate('/dashboard/patients')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="patient-details__profile">
                    <div className="patient-details__avatar" style={{ overflow: 'hidden', background: patient.photo_url ? 'transparent' : 'var(--color-primary-light)' }}>
                        {patient.photo_url ? (
                            <img src={api.getPhotoUrl(patient.photo_url)} alt={patient.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                            patient.name?.split(' ').map(n => n[0]).join('').toUpperCase()
                        )}
                    </div>
                    <div>
                        <h1 className="patient-details__name">{patient.name}</h1>
                        <p className="patient-details__id">ID: #P-{patient.id}</p>
                    </div>
                </div>
                <div className={`risk-badge ${getRiskBadgeClass(latestVitals.risk_level)}`}>
                    {latestVitals.risk_level || 'Stable'}
                </div>
            </header>

            <div className="patient-details__grid">
                {/* Core Vitals Overview */}
                <section className="vitals-overview">
                    <div className="details-card">
                        <div className="details-card__header">
                            <Activity size={18} />
                            <h3>Latest Reading</h3>
                            <span className="timestamp">
                                <Clock size={14} />
                                {latestVitals.recorded_at ? new Date(latestVitals.recorded_at).toLocaleString() : 'No data'}
                            </span>
                        </div>
                        <div className="vitals-metrics">
                            <div className="metric-item">
                                <div className="metric-icon" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                                    <Heart size={20} />
                                </div>
                                <div className="metric-info">
                                    <span className="label">Heart Rate</span>
                                    <span className="value">{latestVitals.heart_rate || '--'} <small>BPM</small></span>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-icon" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3B82F6' }}>
                                    <Wind size={20} />
                                </div>
                                <div className="metric-info">
                                    <span className="label">SpO₂</span>
                                    <span className="value">{latestVitals.spo2 || '--'} <small>%</small></span>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-icon" style={{ background: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
                                    <Thermometer size={20} />
                                </div>
                                <div className="metric-info">
                                    <span className="label">Temp</span>
                                    <span className="value">{latestVitals.temperature || '--'} <small>°C</small></span>
                                </div>
                            </div>
                            <div className="metric-item">
                                <div className="metric-icon" style={{ background: 'rgba(124, 58, 237, 0.1)', color: '#7C3AED' }}>
                                    <Activity size={20} />
                                </div>
                                <div className="metric-info">
                                    <span className="label">BP</span>
                                    <span className="value">
                                        {latestVitals.bp_systolic ? `${latestVitals.bp_systolic}/${latestVitals.bp_diastolic}` : '--'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Patient Information */}
                <section className="patient-info">
                    <div className="details-card">
                        <div className="details-card__header">
                            <User size={18} />
                            <h3>Patient Profile</h3>
                        </div>
                        <div className="profile-data">
                            <div className="data-row">
                                <span className="label">Email</span>
                                <span className="value">{patient.email}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Joined</span>
                                <span className="value">{new Date(patient.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="data-row">
                                <span className="label">Status</span>
                                <span className="value status--active">Active</span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Historical Vitals Table */}
                <section className="vitals-history">
                    <div className="details-card">
                        <div className="details-card__header">
                            <Calendar size={18} />
                            <h3>Medical History</h3>
                        </div>
                        <div className="history-table-container">
                            <table className="history-table">
                                <thead>
                                    <tr>
                                        <th>Date & Time</th>
                                        <th>HR</th>
                                        <th>SpO₂</th>
                                        <th>Temp</th>
                                        <th>BP</th>
                                        <th>Risk</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {vitals.length > 0 ? vitals.map((v, i) => (
                                        <tr key={i}>
                                            <td>{new Date(v.recorded_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td>
                                            <td>{v.heart_rate}</td>
                                            <td>{v.spo2}%</td>
                                            <td>{v.temperature}°C</td>
                                            <td>{(v.bp_systolic && v.bp_diastolic) ? `${v.bp_systolic}/${v.bp_diastolic}` : (v.bp_systolic || v.bp_diastolic || '--')}</td>
                                            <td>
                                                <span className={`mini-badge ${getRiskBadgeClass(v.risk_level)}`}>
                                                    {v.risk_level || 'Stable'}
                                                </span>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan="6" className="no-data">No history found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
}
