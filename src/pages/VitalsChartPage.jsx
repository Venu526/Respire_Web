import { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, Droplet, Heart, Wind, Thermometer, Activity, AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './VitalsChartPage.css';

const VITAL_TYPES = [
    { key: 'spo2', label: 'SpO₂', unit: '%', icon: Droplet, color: '#EF4444', normalRange: [95, 100], api_key: 'spo2' },
    { key: 'hr', label: 'Heart Rate', unit: 'bpm', icon: Heart, color: '#EC4899', normalRange: [60, 100], api_key: 'heart_rate' },
    { key: 'rr', label: 'Respiratory Rate', unit: 'breaths/min', icon: Wind, color: '#0066CC', normalRange: [12, 20], api_key: 'respiratory_rate' },
    { key: 'temp', label: 'Temperature', unit: '°C', icon: Thermometer, color: '#F59E0B', normalRange: [36.1, 37.2], api_key: 'temperature' },
];

const TIME_RANGES = [
    { key: 'day', label: 'Day', days: 1 },
    { key: 'week', label: 'Week', days: 7 },
    { key: 'month', label: 'Month', days: 30 },
];

function formatDate(d, range) {
    if (range.key === 'day') return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function VitalsChartPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedType, setSelectedType] = useState(VITAL_TYPES[0]);
    const [timeRange, setTimeRange] = useState(TIME_RANGES[1]);
    const [allVitals, setAllVitals] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadData();
        }
    }, [user, timeRange]);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const data = await api.fetchVitals(user.id, timeRange.days);
            setAllVitals(Array.isArray(data) ? data : (data?.data || []));
        } catch (err) {
            console.error('Error fetching vitals for charts:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const chartData = useMemo(() => {
        if (!allVitals.length) return [];
        // Map API data to chart format and reverse to keep chronological order (API returns DESC)
        return allVitals
            .map(entry => ({
                date: new Date(entry.recorded_at),
                value: parseFloat(entry[selectedType.api_key])
            }))
            .filter(d => !isNaN(d.value))
            .reverse();
    }, [allVitals, selectedType.api_key]);

    const stats = useMemo(() => {
        if (!chartData.length) return { avg: 0, latest: 0, prev: 0, trend: '→', inRange: true };
        const avg = chartData.reduce((s, d) => s + d.value, 0) / chartData.length;
        const latest = chartData[chartData.length - 1]?.value || 0;
        const prev = chartData.length >= 2 ? chartData[chartData.length - 2].value : latest;
        const trend = latest > prev ? '↑' : latest < prev ? '↓' : '→';
        const inRange = latest >= selectedType.normalRange[0] && latest <= selectedType.normalRange[1];
        return { avg, latest, prev, trend, inRange };
    }, [chartData, selectedType.normalRange]);

    // SVG chart dimensions
    const W = 600, H = 200, PX = 40, PY = 20;

    const renderChart = () => {
        if (!chartData.length) return null;

        const values = chartData.map(d => d.value);
        const minV = Math.min(...values) - (selectedType.key === 'temp' ? 0.5 : 5);
        const maxV = Math.max(...values) + (selectedType.key === 'temp' ? 0.5 : 5);
        const rangeV = maxV - minV || 1;

        const points = chartData.map((d, i) => ({
            x: PX + (i / Math.max(1, chartData.length - 1)) * (W - 2 * PX),
            y: PY + (1 - (d.value - minV) / rangeV) * (H - 2 * PY),
        }));

        const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
        const areaPath = linePath + ` L ${points[points.length - 1].x} ${H - PY} L ${points[0].x} ${H - PY} Z`;

        return (
            <>
                {[0, 0.25, 0.5, 0.75, 1].map((f, i) => {
                    const y = PY + f * (H - 2 * PY);
                    const val = maxV - f * rangeV;
                    return (
                        <g key={i}>
                            <line x1={PX} y1={y} x2={W - PX} y2={y} stroke="rgba(0,0,0,0.06)" strokeWidth="1" />
                            <text x={PX - 6} y={y + 4} fontSize="10" fill="#94A3B8" textAnchor="end">{val.toFixed(selectedType.key === 'temp' ? 1 : 0)}</text>
                        </g>
                    );
                })}
                <path d={areaPath} fill={`${selectedType.color}15`} />
                <path d={linePath} fill="none" stroke={selectedType.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {points.map((p, i) => (
                    <circle key={i} cx={p.x} cy={p.y} r="3.5" fill={selectedType.color} stroke="#fff" strokeWidth="1.5" />
                ))}
            </>
        );
    };

    if (isLoading) {
        return (
            <div className="charts-page charts-page--loading">
                <div className="spinner"></div>
                <p>Loading vitals data...</p>
            </div>
        );
    }

    return (
        <div className="charts-page">
            <button className="charts-page__back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Back
            </button>
            <h1>Vitals Charts</h1>

            {/* Time Range Selector */}
            <div className="charts-page__time-range">
                {TIME_RANGES.map(r => (
                    <button key={r.key} className={`charts-page__time-btn ${timeRange.key === r.key ? 'charts-page__time-btn--active' : ''}`}
                        onClick={() => setTimeRange(r)}>
                        {r.label}
                    </button>
                ))}
            </div>

            {/* Vital Type Selector */}
            <div className="charts-page__type-selector">
                {VITAL_TYPES.map(t => (
                    <button key={t.key}
                        className={`charts-type-btn ${selectedType.key === t.key ? 'charts-type-btn--active' : ''}`}
                        style={selectedType.key === t.key ? { background: t.color, color: '#fff' } : {}}
                        onClick={() => setSelectedType(t)}>
                        <t.icon size={14} />
                        <span>{t.label}</span>
                    </button>
                ))}
            </div>

            {/* Chart */}
            <div className="charts-page__chart-card">
                <div className="charts-page__chart-header">
                    <div className="charts-page__chart-title">
                        <selectedType.icon size={18} style={{ color: selectedType.color }} />
                        <span>{selectedType.label}</span>
                    </div>
                    <span className="charts-page__normal">Normal: {selectedType.normalRange[0]}–{selectedType.normalRange[1]} {selectedType.unit}</span>
                </div>
                {chartData.length > 0 ? (
                    <svg viewBox={`0 0 ${W} ${H}`} className="charts-page__svg">
                        {renderChart()}
                    </svg>
                ) : (
                    <div className="charts-page__empty-chart">
                        <Activity size={48} color="#94A3B8" />
                        <p>No data recorded for this time period</p>
                    </div>
                )}
            </div>

            {/* Stats Cards */}
            <div className="charts-page__stats">
                <div className="charts-stat-card">
                    <span className="charts-stat-card__title">Average</span>
                    <span className="charts-stat-card__value" style={{ color: selectedType.color }}>{stats.avg.toFixed(1)}</span>
                    <span className="charts-stat-card__unit">{selectedType.unit}</span>
                </div>
                <div className="charts-stat-card">
                    <span className="charts-stat-card__title">Latest</span>
                    <span className="charts-stat-card__value" style={{ color: selectedType.color }}>{stats.latest.toFixed(1)}</span>
                    <span className="charts-stat-card__unit">{selectedType.unit}</span>
                </div>
                <div className="charts-stat-card">
                    <span className="charts-stat-card__title">Trend</span>
                    <span className="charts-stat-card__value" style={{ color: stats.inRange ? '#10B981' : '#F59E0B' }}>{stats.trend}</span>
                    <span className="charts-stat-card__unit">{stats.inRange ? 'Normal' : 'Watch'}</span>
                </div>
            </div>

            {/* Recent Readings */}
            <div className="charts-page__recent">
                <h3>Recent Readings</h3>
                <div className="charts-page__readings">
                    {chartData.length > 0 ? (
                        [...chartData].reverse().slice(0, 5).map((d, i) => (
                            <div key={i} className="charts-reading">
                                <span className="charts-reading__date">{formatDate(d.date, timeRange)}</span>
                                <span className="charts-reading__value">{d.value.toFixed(1)} {selectedType.unit}</span>
                            </div>
                        ))
                    ) : (
                        <div className="charts-empty-readings">
                            <AlertCircle size={20} color="#94A3B8" />
                            <span>Add vitals to see history here</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
