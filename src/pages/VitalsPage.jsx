import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Wind, Activity, Droplet, Heart, Thermometer,
    TrendingUp, Send, BarChart3, Plus, ChevronRight
} from 'lucide-react';
import './VitalsPage.css';

export default function VitalsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [vitals, setVitals] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadVitals();
            const interval = setInterval(loadVitals, 30000);
            return () => clearInterval(interval);
        }
    }, [user?.id]);

    const loadVitals = async () => {
        if (!user?.id) return;
        try {
            // Load latest vitals for the patient dashboard
            const data = await api.fetchVitals(user.id);
            // API returns array sorted by recorded_at DESC, so first item is latest
            const rows = Array.isArray(data) ? data : (data?.data || []);
            if (rows.length > 0) {
                const loginTime = sessionStorage.getItem('session_login_time');
                const hasSessionVitals = sessionStorage.getItem('has_session_vitals') === 'true';
                
                let showVitals = hasSessionVitals;
                
                if (!showVitals && loginTime) {
                    const loginDate = new Date(loginTime);
                    showVitals = rows.some(row => {
                        if (!row.recorded_at) return false;
                        const recordedDate = new Date(row.recorded_at.replace(/-/g, '/'));
                        return recordedDate >= loginDate;
                    });
                    if (showVitals) {
                        sessionStorage.setItem('has_session_vitals', 'true');
                    }
                }
                
                if (showVitals) {
                    setVitals(rows[0]);
                } else {
                    setVitals(null);
                }
            }
        } catch (err) {
            console.log('No vitals data yet');
        } finally {
            setLoading(false);
        }
    };

    // Format BP from separate systolic/diastolic columns
    const getBP = () => {
        if (vitals?.bp_systolic && vitals?.bp_diastolic) {
            return `${vitals.bp_systolic}/${vitals.bp_diastolic}`;
        }
        if (vitals?.bp_systolic) return `${vitals.bp_systolic}/-`;
        if (vitals?.bp_diastolic) return `-/${vitals.bp_diastolic}`;
        if (vitals?.blood_pressure) return vitals.blood_pressure;
        return null;
    };

    const vitalRows = [
        { icon: Wind, title: 'Respiratory Rate', value: vitals?.respiratory_rate, unit: 'breaths/min', color: '#0066CC' },
        { icon: Droplet, title: 'SpO₂', value: vitals?.spo2, unit: '%', color: '#EF4444' },
        { icon: Heart, title: 'Heart Rate', value: vitals?.heart_rate, unit: 'bpm', color: '#EC4899' },
        { icon: Activity, title: 'Blood Pressure', value: getBP(), unit: '', color: '#7C3AED' },
        { icon: Thermometer, title: 'Temperature', value: vitals?.temperature, unit: ' °C', color: '#F59E0B' },
        { icon: Wind, title: 'Oxygen Device', value: vitals?.oxygen_device, unit: '', color: '#0066CC' },
        { icon: Droplet, title: 'FiO₂', value: vitals?.fio2, unit: '%', color: '#0A84FF' },
        { icon: Activity, title: 'Oxygen Flow', value: vitals?.oxygen_flow, unit: 'L/min', color: '#AF52DE' },
    ];

    const hasVitals = vitalRows.some(r => r.value);

    if (loading) {
        return (
            <div className="vitals-page vitals-page--loading">
                <div className="vitals-spinner" />
            </div>
        );
    }

    return (
        <div className="vitals-page">
            {/* Header */}
            <div className="vitals-page__header">
                <h1>Patient Vitals</h1>
                <button className="vitals-page__chart-btn" onClick={() => navigate('/dashboard/charts')}>
                    <BarChart3 size={16} />
                    <span>Charts</span>
                </button>
            </div>

            {/* Vital Cards */}
            <div className="vitals-page__cards">
                {vitalRows.map((row, i) => (
                    <div className="vital-row" key={i}>
                        <div className="vital-row__icon" style={{ background: row.color }}>
                            <row.icon size={20} color="#fff" />
                        </div>
                        <div className="vital-row__info">
                            <span className="vital-row__title">{row.title}</span>
                            <span className="vital-row__value">
                                {row.value ? `${row.value} ${row.unit}` : '—'}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State */}
            {!hasVitals && (
                <div className="vitals-page__empty">
                    <Activity size={50} className="vitals-page__empty-icon" />
                    <h3>No active session vitals</h3>
                    <p>Add current vitals to assess your respiratory status</p>
                    <button className="vitals-page__add-btn" onClick={() => navigate('/dashboard/add-vitals')}>
                        <Plus size={18} />
                        Add Vitals
                    </button>
                </div>
            )}

            {/* Quick Actions */}
            {hasVitals && (
                <div className="vitals-page__section">
                    <h3>Quick Actions</h3>
                    <div className="vitals-page__actions">
                        <button className="vitals-quick-action" onClick={() => navigate('/dashboard/share-vitals')}>
                            <div className="vitals-quick-action__icon" style={{ background: '#10B981' }}>
                                <Send size={18} color="#fff" />
                            </div>
                            <span>Share</span>
                        </button>
                        <button className="vitals-quick-action" onClick={() => navigate('/dashboard/charts')}>
                            <div className="vitals-quick-action__icon" style={{ background: '#0066CC' }}>
                                <TrendingUp size={18} color="#fff" />
                            </div>
                            <span>Trends</span>
                        </button>
                        <button className="vitals-quick-action" onClick={() => navigate('/dashboard/add-vitals')}>
                            <div className="vitals-quick-action__icon" style={{ background: '#F59E0B' }}>
                                <Plus size={18} color="#fff" />
                            </div>
                            <span>Update</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
