import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Clock, Calendar, Heart, Wind, Thermometer,
    Activity, ChevronLeft, ArrowLeft, TrendingUp,
    AlertCircle, Filter, Search
} from 'lucide-react';
import './HistoryPage.css';

export default function HistoryPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterDays, setFilterDays] = useState('7'); // Default to 1 week

    useEffect(() => {
        if (user?.id) {
            loadHistory();
        }
    }, [user, filterDays]);

    const loadHistory = async () => {
        try {
            setLoading(true);
            const data = await api.fetchVitals(user.id, filterDays === 'all' ? null : filterDays);
            setHistory(Array.isArray(data) ? data : (data?.data || []));
        } catch (error) {
            console.error('Failed to load vitals history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = () => {
        if (history.length === 0) return;

        const headers = ["Date", "Time", "Heart Rate (BPM)", "SpO2 (%)", "Temp (°C)", "BP (Sys/Dia)", "Risk Level"];
        const rows = history.map(entry => {
            // Fix date parsing for cross-browser compatibility
            const safeDateStr = entry.recorded_at ? entry.recorded_at.replace(/-/g, '/') : null;
            const d = new Date(safeDateStr);

            let dateStr = '—';
            let timeStr = '—';

            if (d && !isNaN(d.getTime())) {
                const day = String(d.getDate()).padStart(2, '0');
                const month = d.toLocaleString('en-US', { month: 'short' });
                const year = d.getFullYear();
                // Use DD-MMM-YYYY format to prevent Excel from showing hash symbols (too wide)
                dateStr = `${day}-${month}-${year}`;
                timeStr = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            }

            return [
                dateStr,
                timeStr,
                entry.heart_rate || '—',
                entry.spo2 || '—',
                entry.temperature || '—',
                (entry.bp_systolic && entry.bp_diastolic) ? `"${entry.bp_systolic}/${entry.bp_diastolic}"` : '—',
                entry.risk_level || 'Stable'
            ];
        });

        const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `vitals_history_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getRiskBadgeClass = (risk) => {
        const r = risk?.toLowerCase() || '';
        if (r.includes('critical') || r.includes('high')) return 'risk-badge--critical';
        if (r.includes('moderate') || r.includes('medium')) return 'risk-badge--moderate';
        return 'risk-badge--stable';
    };

    const filteredHistory = history.filter(entry =>
        new Date(entry.recorded_at).toLocaleDateString().includes(searchTerm) ||
        (entry.risk_level || 'Stable').toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) {
        return (
            <div className="history-page--loading">
                <div className="spinner"></div>
                <p>Loading your health history...</p>
            </div>
        );
    }

    return (
        <div className="history-page">
            <header className="history-page__header">
                <button className="back-btn" onClick={() => navigate('/dashboard')}>
                    <ArrowLeft size={20} />
                </button>
                <div className="history-page__title-area">
                    <h1 className="history-page__title">Vitals History</h1>
                    <p className="history-page__subtitle">Review your health records for the last {filterDays === 'all' ? 'month/year' : `${filterDays} days`}</p>
                </div>
                <div className="history-page__header-actions">
                    <button className="download-btn" onClick={handleDownload} title="Download CSV">
                        <Activity size={18} />
                        <span>Download CSV</span>
                    </button>
                    <button className="trends-btn" onClick={() => navigate('/dashboard/charts')}>
                        <TrendingUp size={18} />
                        <span>View Trends</span>
                    </button>
                </div>
            </header>

            <div className="history-page__controls">
                <div className="search-box">
                    <Search size={18} className="search-icon" />
                    <input
                        type="text"
                        placeholder="Search by date or risk status..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="filter-box">
                    <Filter size={18} className="filter-icon" />
                    <select
                        value={filterDays}
                        onChange={(e) => setFilterDays(e.target.value)}
                        className="filter-select"
                    >
                        <option value="7">Last 7 Days</option>
                        <option value="30">Last 30 Days</option>
                        <option value="90">Last 90 Days</option>
                        <option value="all">All Time</option>
                    </select>
                </div>
            </div>

            <div className="history-list">
                {filteredHistory.length > 0 ? (
                    filteredHistory.map((entry, i) => (
                        <div key={i} className="history-card">
                            <div className="history-card__header">
                                <div className="history-card__date">
                                    <Calendar size={16} />
                                    <span>{new Date(entry.recorded_at).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                                </div>
                                <div className="history-card__time">
                                    <Clock size={16} />
                                    <span>{new Date(entry.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className={`risk-badge ${getRiskBadgeClass(entry.risk_level)}`}>
                                    {entry.risk_level || 'Stable'}
                                </div>
                            </div>

                            <div className="history-card__metrics">
                                <div className="metric">
                                    <Heart size={14} style={{ color: '#EF4444' }} />
                                    <span className="label">Heart Rate</span>
                                    <span className="value">{entry.heart_rate} <small>BPM</small></span>
                                </div>
                                <div className="metric">
                                    <Wind size={14} style={{ color: '#3B82F6' }} />
                                    <span className="label">SpO₂</span>
                                    <span className="value">{entry.spo2}%</span>
                                </div>
                                <div className="metric">
                                    <Thermometer size={14} style={{ color: '#F59E0B' }} />
                                    <span className="label">Temp</span>
                                    <span className="value">{entry.temperature}°C</span>
                                </div>
                                <div className="metric">
                                    <Activity size={14} style={{ color: '#7C3AED' }} />
                                    <span className="label">Blood Pressure</span>
                                    <span className="value">{entry.bp_systolic}/{entry.bp_diastolic}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="history-empty">
                        <AlertCircle size={48} />
                        <h3>No records found</h3>
                        <p>You haven't recorded any vitals matching your search.</p>
                        <button onClick={() => navigate('/dashboard/add-vitals')}>Record New Vitals</button>
                    </div>
                )}
            </div>
        </div>
    );
}
