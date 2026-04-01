import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Activity, Brain, Wind, Target, Plus, TrendingUp, ChevronRight, ShieldCheck, Heart, Droplet, Thermometer, Stethoscope, Clock, AlertTriangle, ArrowUp, ArrowDown, ArrowRight, Gauge } from 'lucide-react';
import { getPredictions, determineRiskLevel } from '../utils/AIPredictionService';
import './HomePage.css';

export default function HomePage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [vitals, setVitals] = useState(null);
    const [prevVitals, setPrevVitals] = useState(null);
    const greeting = new Date().getHours() < 12 ? 'Good Morning' : new Date().getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

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
            const data = await api.fetchVitals(user.id);
            let rows = Array.isArray(data) ? data : (data?.data || []);
            
            if (rows.length > 0) {
                // Cross-platform sync: check if any vitals were recorded after session login time
                const loginTime = sessionStorage.getItem('session_login_time');
                const hasSessionVitals = sessionStorage.getItem('has_session_vitals') === 'true';
                
                let showVitals = hasSessionVitals;
                
                // Also check if any vitals were added from another platform (e.g. iOS app)
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
                    const latest = rows[0];
                    setVitals(latest);
                    
                    if (rows.length > 1) {
                        setPrevVitals(rows[1]);
                    }
                } else {
                    setVitals(null);
                    setPrevVitals(null);
                }
            }
        } catch (err) {
            console.log('No vitals data yet');
        }
    };

    const hasVitals = !!vitals;

    // Helper to safely get vital value, applying iOS defaults
    const getVitalValue = (record, param) => {
        if (!record) return null;
        let val = Number(record[param]);
        if (isNaN(val) || record[param] === null) {
            // iOS defaults in ClinicalAssessment.from()
            if (param === 'spo2') return 98;
            if (param === 'heart_rate') return 72;
            if (param === 'respiratory_rate') return 16;
            return 0;
        }
        return val;
    };

    const getTrend = (param) => {
        if (!vitals || !prevVitals) return { direction: 'flat' };
        
        const current = getVitalValue(vitals, param);
        const prev = getVitalValue(prevVitals, param);
        
        if (current === null || prev === null) return { direction: 'flat' };
        
        const diff = current - prev;
        
        // Thresholds matching iOS HomeView.swift exactly
        if (param === 'spo2') {
            if (diff > 1) return { direction: 'up' };
            if (diff < -1) return { direction: 'down' };
        } else {
            // RR and HR
            if (diff > 2) return { direction: 'up' };
            if (diff < -2) return { direction: 'down' };
        }
        
        return { direction: 'flat' };
    };

    const renderTrendIcon = (trend) => {
        // Red for UP, Green for DOWN (matching iOS visual bug/feature)
        if (trend.direction === 'up') return <ArrowUp size={16} color="#FF3B30" strokeWidth={3} />;
        if (trend.direction === 'down') return <ArrowDown size={16} color="#34C759" strokeWidth={3} />;
        if (trend.direction === 'flat') return <ArrowRight size={16} color="#8E8E93" strokeWidth={3} />;
        return null;
    };

    // Helper to determine if a specific vital is "abnormal" for UI highlighting
    const getVitalStatus = (param, value) => {
        if (value === null || value === undefined) return 'normal';
        const num = Number(value);
        if (isNaN(num)) return 'normal';

        if (param === 'spo2') {
            if (num < 92) return 'critical';
            if (num < 94) return 'warning';
            if (num < 96) return 'info';
        } else if (param === 'respiratory_rate') {
            if (num >= 30 || num < 9) return 'critical';
            if (num >= 21) return 'warning';
            if (num >= 15) return 'info';
        } else if (param === 'heart_rate') {
            if (num >= 130 || num < 40) return 'critical';
            if (num >= 111 || num <= 50) return 'warning';
            if (num >= 101) return 'info';
        } else if (param === 'temperature') {
            let clinicalTemp = num;
            if (num > 70) clinicalTemp = (num - 32) * 5 / 9;
            if (clinicalTemp >= 38.5 || clinicalTemp < 35.0) return 'warning';
        } else if (param === 'bp_systolic') {
            if (num >= 200 || num < 70) return 'critical';
            if (num <= 100) return 'warning';
        } else if (param === 'borg_scale') {
            if (num >= 7) return 'critical';
            if (num >= 4) return 'warning';
            if (num >= 3) return 'info';
        }
        return 'normal';
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'critical': return '#FF3B30';
            case 'warning': return '#FF9500';
            case 'info': return '#FFCC00';
            default: return '#FFFFFF';
        }
    };

    // Removed old vitalCards array

    // AI Predictions
    const predictions = hasVitals ? getPredictions(vitals) : [];
    const highestRisk = predictions.some(p => p.risk === 'Critical') ? 'Critical'
        : predictions.some(p => p.risk === 'High') ? 'High'
            : predictions.some(p => p.risk === 'Moderate') ? 'Moderate' : 'Low Risk';

    const getRiskColor = (risk) => {
        switch (risk) {
            case 'Critical': return '#DC2626';
            case 'High': return '#EA580C';
            case 'Moderate': return '#CA8A04';
            default: return '#16A34A';
        }
    };

    const currentRiskLevel = hasVitals ? determineRiskLevel(vitals) : 'No Data';

    // Override the generic "AI Risk Assessment" label to show the accurate computed risk
    const currentRiskLevelUI = currentRiskLevel;

    return (
        <div className="home-page">
            {/* Greeting Header */}
            <div className="home-page__header">
                <div>
                    <span className="home-page__greeting">{greeting},</span>
                    <h1 className="home-page__name">{user?.name ? user.name.split(' ')[0] : 'there'} 👋</h1>
                </div>
            </div>

            {/* AI Risk Card */}
            <button className="home-page__risk-card" style={{ background: hasVitals ? `linear-gradient(135deg, ${getRiskColor(currentRiskLevel)}, ${getRiskColor(currentRiskLevel)}CC)` : 'var(--gradient-primary)' }} onClick={() => navigate('/dashboard/ai-risk')}>
                <div className="home-page__risk-left">
                    <span className="home-page__risk-label">AI Risk Assessment</span>
                    <span className="home-page__risk-level">{currentRiskLevelUI}</span>
                    <span className="home-page__risk-detail">{hasVitals ? 'Based on your latest vitals' : 'Add vitals to get assessment'}</span>
                </div>
                <div className="home-page__risk-icon">
                    <ShieldCheck size={40} />
                </div>
            </button>

            {/* Action Tiles */}
            <div className="home-page__actions">
                <button className="home-page__tile" onClick={() => navigate('/dashboard/add-vitals')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(0,102,204,0.1)' }}>
                        <Plus size={22} style={{ color: '#0066CC' }} />
                    </div>
                    <span className="home-page__tile-label">Add Vital</span>
                </button>
                <button className="home-page__tile" onClick={() => navigate('/dashboard/charts')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>
                        <TrendingUp size={22} style={{ color: '#10B981' }} />
                    </div>
                    <span className="home-page__tile-label">Charts</span>
                </button>
                <button className="home-page__tile" onClick={() => navigate('/dashboard/ai-risk')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(124,58,237,0.1)' }}>
                        <Brain size={22} style={{ color: '#7C3AED' }} />
                    </div>
                    <span className="home-page__tile-label">AI Analysis</span>
                </button>
                <button className="home-page__tile" onClick={() => navigate('/dashboard/breathing')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(6,182,212,0.1)' }}>
                        <Wind size={22} style={{ color: '#06B6D4' }} />
                    </div>
                    <span className="home-page__tile-label">Breathe</span>
                </button>
                <button className="home-page__tile" onClick={() => navigate('/dashboard/goals')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(236,72,153,0.1)' }}>
                        <Target size={22} style={{ color: '#EC4899' }} />
                    </div>
                    <span className="home-page__tile-label">Goals</span>
                </button>
                <button className="home-page__tile" onClick={() => navigate('/dashboard/doctor')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(20,184,166,0.1)' }}>
                        <Stethoscope size={22} style={{ color: '#14B8A6' }} />
                    </div>
                    <span className="home-page__tile-label">Doctor</span>
                </button>
                <button className="home-page__tile" onClick={() => navigate('/dashboard/history')}>
                    <div className="home-page__tile-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>
                        <Clock size={22} style={{ color: '#F59E0B' }} />
                    </div>
                    <span className="home-page__tile-label">History</span>
                </button>
            </div>

            {/* AI Forecast Card */}
            <div className="home-page__forecast">
                <div className="home-page__forecast-header" style={{ display: 'flex', alignItems: 'center' }}>
                    <Brain size={18} style={{ color: '#7C3AED', marginRight: '8px' }} />
                    <span>5-Hour AI Forecast</span>
                    <ChevronRight size={16} style={{ marginLeft: 'auto', color: 'var(--text-muted)' }} />
                </div>

                {hasVitals ? (
                    <>
                        <p className="home-page__forecast-text" style={{ marginBottom: '16px' }}>
                            Based on your latest vitals, here is a 5-hour predictive trajectory:
                        </p>
                        <div className="home-page__predictions-scroll" style={{ display: 'flex', overflowX: 'auto', paddingBottom: '16px', gap: '12px' }}>
                            {predictions.map((pred, i) => (
                                <div key={i} className="forecast-card" style={{ minWidth: '130px', flex: '0 0 auto' }}>
                                    <span className="forecast-time">{pred.timeLabel}</span>
                                    <div className="forecast-risk-badge" style={{ backgroundColor: `${getRiskColor(pred.risk)}20`, color: getRiskColor(pred.risk) }}>
                                        {pred.risk}
                                    </div>
                                    <div className="forecast-metrics" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Droplet size={14} color="#EF4444" /> {pred.spo2}%</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Heart size={14} color="#EC4899" /> {pred.hr} bpm</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                ) : (
                    <p className="home-page__forecast-text">
                        Add your vitals to receive AI-powered health forecasts and respiratory insights.
                    </p>
                )}
            </div>

            {/* Hospital Warning Banner */}
            {(highestRisk === 'Critical' || highestRisk === 'High' || highestRisk === 'Moderate') && hasVitals && (
                <div className={`hospital-alert banner-${highestRisk.toLowerCase()}`}>
                    <AlertTriangle size={24} className="hospital-alert-icon" />
                    <div className="hospital-alert-content">
                        <h4>{highestRisk === 'Moderate' ? 'Monitor Closely' : 'Urgent Medical Attention Advised'}</h4>
                        <p>
                            {highestRisk === 'Critical' ? 'Your predicted trend shows critical deterioration. Please visit a nearby hospital immediately.'
                                : highestRisk === 'High' ? 'Your predicted trend is concerning. Consider consulting your doctor or visiting a clinic soon.'
                                    : 'Your condition shows moderate decline. Keep a close watch and continue testing your vitals.'}
                        </p>
                    </div>
                </div>
            )}

            <div className="home-page__vitals-section">
                <div className="home-page__vitals-header">
                    <h3>Current Vitals</h3>
                    <span className="home-page__vitals-time">
                        {vitals?.recorded_at ? new Date(vitals.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : ''}
                    </span>
                </div>
                
                <div className="vitals-dark-cards">
                    <div className="vital-dark-card" style={{ borderLeft: getVitalStatus('spo2', vitals?.spo2) !== 'normal' ? `4px solid ${getStatusColor(getVitalStatus('spo2', vitals?.spo2))}` : 'none' }}>
                        <div className="vital-dark-card__header">
                            <Droplet size={22} color={getVitalStatus('spo2', vitals?.spo2) === 'normal' ? "#34C759" : getStatusColor(getVitalStatus('spo2', vitals?.spo2))} fill={getVitalStatus('spo2', vitals?.spo2) === 'normal' ? "#34C759" : getStatusColor(getVitalStatus('spo2', vitals?.spo2))} />
                            {renderTrendIcon(getTrend('spo2'))}
                        </div>
                        <span className="vital-dark-card__value" style={{ color: getStatusColor(getVitalStatus('spo2', vitals?.spo2)) }}>{vitals?.spo2 ? `${vitals.spo2}%` : '—'}</span>
                        <span className="vital-dark-card__label">SpO₂</span>
                    </div>
                    
                    <div className="vital-dark-card" style={{ borderLeft: getVitalStatus('respiratory_rate', vitals?.respiratory_rate) !== 'normal' ? `4px solid ${getStatusColor(getVitalStatus('respiratory_rate', vitals?.respiratory_rate))}` : 'none' }}>
                        <div className="vital-dark-card__header">
                            <Wind size={22} color={getVitalStatus('respiratory_rate', vitals?.respiratory_rate) === 'normal' ? "#0A84FF" : getStatusColor(getVitalStatus('respiratory_rate', vitals?.respiratory_rate))} fill={getVitalStatus('respiratory_rate', vitals?.respiratory_rate) === 'normal' ? "#0A84FF" : getStatusColor(getVitalStatus('respiratory_rate', vitals?.respiratory_rate))} />
                            {renderTrendIcon(getTrend('respiratory_rate'))}
                        </div>
                        <span className="vital-dark-card__value" style={{ color: getStatusColor(getVitalStatus('respiratory_rate', vitals?.respiratory_rate)) }}>{vitals?.respiratory_rate || '—'}</span>
                        <span className="vital-dark-card__label">RR</span>
                    </div>
                    
                    <div className="vital-dark-card" style={{ borderLeft: getVitalStatus('heart_rate', vitals?.heart_rate) !== 'normal' ? `4px solid ${getStatusColor(getVitalStatus('heart_rate', vitals?.heart_rate))}` : 'none' }}>
                        <div className="vital-dark-card__header">
                            <Heart size={22} color={getVitalStatus('heart_rate', vitals?.heart_rate) === 'normal' ? "#FF2D55" : getStatusColor(getVitalStatus('heart_rate', vitals?.heart_rate))} fill={getVitalStatus('heart_rate', vitals?.heart_rate) === 'normal' ? "#FF2D55" : getStatusColor(getVitalStatus('heart_rate', vitals?.heart_rate))} />
                            {renderTrendIcon(getTrend('heart_rate'))}
                        </div>
                        <span className="vital-dark-card__value" style={{ color: getStatusColor(getVitalStatus('heart_rate', vitals?.heart_rate)) }}>{vitals?.heart_rate || '—'}</span>
                        <span className="vital-dark-card__label">HR</span>
                    </div>

                    <div className="vital-dark-card" style={{ borderLeft: getVitalStatus('bp_systolic', vitals?.bp_systolic) !== 'normal' ? `4px solid ${getStatusColor(getVitalStatus('bp_systolic', vitals?.bp_systolic))}` : 'none' }}>
                        <div className="vital-dark-card__header">
                            <Activity size={22} color={getVitalStatus('bp_systolic', vitals?.bp_systolic) === 'normal' ? "#AF52DE" : getStatusColor(getVitalStatus('bp_systolic', vitals?.bp_systolic))} />
                            {renderTrendIcon(getTrend('bp_systolic'))}
                        </div>
                        <span className="vital-dark-card__value" style={{ color: getStatusColor(getVitalStatus('bp_systolic', vitals?.bp_systolic)) }}>
                            {vitals?.bp_systolic ? `${vitals.bp_systolic}/${vitals.bp_diastolic}` : '—'}
                        </span>
                        <span className="vital-dark-card__label">BP</span>
                    </div>

                    <div className="vital-dark-card" style={{ borderLeft: getVitalStatus('temperature', vitals?.temperature) !== 'normal' ? `4px solid ${getStatusColor(getVitalStatus('temperature', vitals?.temperature))}` : 'none' }}>
                        <div className="vital-dark-card__header">
                            <Thermometer size={22} color={getVitalStatus('temperature', vitals?.temperature) === 'normal' ? "#FF9500" : getStatusColor(getVitalStatus('temperature', vitals?.temperature))} />
                            {renderTrendIcon(getTrend('temperature'))}
                        </div>
                        <span className="vital-dark-card__value" style={{ color: getStatusColor(getVitalStatus('temperature', vitals?.temperature)) }}>
                            {vitals?.temperature ? `${Number(vitals.temperature).toFixed(1)}°C` : '—'}
                        </span>
                        <span className="vital-dark-card__label">Temp</span>
                    </div>

                    <div className="vital-dark-card" style={{ borderLeft: getVitalStatus('borg_scale', vitals?.borg_scale) !== 'normal' ? `4px solid ${getStatusColor(getVitalStatus('borg_scale', vitals?.borg_scale))}` : 'none' }}>
                        <div className="vital-dark-card__header">
                            <Gauge size={22} color={getVitalStatus('borg_scale', vitals?.borg_scale) === 'normal' ? "#34C759" : getStatusColor(getVitalStatus('borg_scale', vitals?.borg_scale))} />
                            {renderTrendIcon(getTrend('borg_scale'))}
                        </div>
                        <span className="vital-dark-card__value" style={{ color: getStatusColor(getVitalStatus('borg_scale', vitals?.borg_scale)) }}>
                            {vitals?.borg_scale ? `${vitals.borg_scale}/10` : '—'}
                        </span>
                        <span className="vital-dark-card__label">Borg</span>
                    </div>
                </div>

                {hasVitals && (
                    <div className="vitals-respiratory-footer">
                        <span className="footer-item">
                            <span className={`status-dot ${vitals.work_of_breathing === 'Normal' ? 'healthy' : 'warning'}`}></span> 
                            WOB: {vitals.work_of_breathing || 'Normal'}
                        </span>
                        
                        {vitals.accessory_muscle_use === "1" || vitals.accessory_muscle_use === 1 ? (
                            <span className="footer-item" style={{ color: '#FF9500' }}>
                                <AlertTriangle size={14} /> Accessory Muscles
                            </span>
                        ) : null}

                        <span className="footer-item">
                            <Droplet size={14} color="#0A84FF" />
                            FiO₂: {Math.round(vitals.fio2 || 21)}%
                        </span>

                        {vitals.oxygen_flow && (
                            <span className="footer-item">
                                <Activity size={14} color="#AF52DE" />
                                Flow: {vitals.oxygen_flow} L/min
                            </span>
                        )}

                        <span className="footer-item device-text">
                            {vitals.oxygen_device || 'Room Air'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
