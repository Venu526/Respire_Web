import { useState, useEffect } from 'react';
import api from '../services/api';
import {
    AlertTriangle, Bell, Clock, User, CheckCircle2,
    Filter, RefreshCcw, ShieldAlert, AlertCircle
} from 'lucide-react';
import './AlertsPage.css';

export default function AlertsPage() {
    const [alerts, setAlerts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, active, acknowledged

    useEffect(() => {
        loadAlerts();
    }, []);

    const loadAlerts = async () => {
        try {
            setLoading(true);
            const data = await api.fetchDoctorAlerts();
            setAlerts(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load alerts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAcknowledge = async (alertId) => {
        try {
            await api.acknowledgeAlert(alertId, 'Dr. Sathya');
            // Optimistic update
            setAlerts(alerts.map(a => a.id === alertId ? { ...a, is_acknowledged: 1 } : a));
        } catch (error) {
            console.error('Failed to acknowledge alert:', error);
        }
    };

    const filteredAlerts = alerts.filter(a => {
        if (filter === 'active') return a.is_acknowledged === 0;
        if (filter === 'acknowledged') return a.is_acknowledged === 1;
        return true;
    });

    const formatTime = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const getSeverityClass = (severity) => {
        const s = severity?.toLowerCase();
        if (s === 'critical' || s === 'high') return 'alert-item--high';
        if (s === 'medium') return 'alert-item--medium';
        return 'alert-item--low';
    };

    return (
        <div className="alerts-page">
            <header className="alerts-page__header">
                <div className="alerts-page__header-info">
                    <h1 className="alerts-page__title">Management Alerts</h1>
                    <p className="alerts-page__subtitle">Monitor and respond to patient health events</p>
                </div>
                <button className="refresh-btn" onClick={loadAlerts} disabled={loading}>
                    <RefreshCcw size={18} className={loading ? 'spin' : ''} />
                </button>
            </header>

            <div className="alerts-page__filters">
                <div className="filter-group">
                    <button
                        className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                        onClick={() => setFilter('all')}
                    >All Alerts</button>
                    <button
                        className={`filter-btn ${filter === 'active' ? 'active active--danger' : ''}`}
                        onClick={() => setFilter('active')}
                    >Active {alerts.filter(a => !a.is_acknowledged).length > 0 && <span className="count-badge">{alerts.filter(a => !a.is_acknowledged).length}</span>}</button>
                    <button
                        className={`filter-btn ${filter === 'acknowledged' ? 'active' : ''}`}
                        onClick={() => setFilter('acknowledged')}
                    >History</button>
                </div>
            </div>

            {loading ? (
                <div className="alerts-page__loading">
                    <div className="pulse-loader"></div>
                    <p>Fetching latest alerts...</p>
                </div>
            ) : filteredAlerts.length === 0 ? (
                <div className="alerts-page__empty">
                    <div className="check-all-done">
                        <CheckCircle2 size={48} />
                    </div>
                    <h3>No Alerts Found</h3>
                    <p>Everything looks stable at the moment.</p>
                </div>
            ) : (
                <div className="alerts-list">
                    {filteredAlerts.map(alert => (
                        <div key={alert.id} className={`alert-item ${getSeverityClass(alert.severity)} ${alert.is_acknowledged ? 'alert-item--acknowledged' : ''}`}>
                            <div className="alert-item__icon">
                                {alert.severity?.toLowerCase() === 'high' || alert.severity?.toLowerCase() === 'critical' ? (
                                    <ShieldAlert size={24} />
                                ) : (
                                    <AlertCircle size={24} />
                                )}
                            </div>

                            <div className="alert-item__content">
                                <div className="alert-item__top">
                                    <h3 className="alert-item__title">{alert.title || 'Health Alert'}</h3>
                                    <div className="alert-item__time">
                                        <Clock size={12} />
                                        <span>{formatDate(alert.created_at)} at {formatTime(alert.created_at)}</span>
                                    </div>
                                </div>
                                <p className="alert-item__message">{alert.message}</p>
                                <div className="alert-item__patient">
                                    <User size={12} />
                                    <span>Patient: <strong>{alert.patient_name || 'Unknown'}</strong></span>
                                </div>
                            </div>

                            <div className="alert-item__actions">
                                {alert.is_acknowledged ? (
                                    <span className="acknowledged-status">
                                        <CheckCircle2 size={14} />
                                        Acknowledged
                                    </span>
                                ) : (
                                    <button
                                        className="acknowledge-btn"
                                        onClick={() => handleAcknowledge(alert.id)}
                                    >
                                        Acknowledge
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
