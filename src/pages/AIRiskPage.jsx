import { useState, useEffect } from 'react';
import { ChevronLeft, ShieldCheck, TrendingUp, Activity, Droplet, Heart, Wind, Thermometer, Lightbulb, AlertTriangle, Gauge } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { determineRiskLevel } from '../utils/AIPredictionService';
import './AIRiskPage.css';

export default function AIRiskPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [selectedParam, setSelectedParam] = useState('spo2');
    const [vitalsData, setVitalsData] = useState([]);
    const [latestVital, setLatestVital] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (user?.id) {
            loadVitals();
        }
    }, [user?.id]);

    const loadVitals = async () => {
        if (!user?.id) return;
        setIsLoading(true);
        try {
            // Load latest vitals for AI risk analysis
            const data = await api.fetchVitals(user.id);
            const rows = Array.isArray(data) ? data : (data?.data || []);
            setVitalsData(rows);
            if (rows.length > 0) {
                setLatestVital(rows[0]);
            }
        } catch (err) {
            console.error('Error fetching vitals for AI risk page', err);
        } finally {
            setIsLoading(false);
        }
    };

    // Derived states based on actual data
    const riskLevelCalc = latestVital ? determineRiskLevel(latestVital) : 'No Data';
    const riskLevel = riskLevelCalc || 'No Data';

    // Determine color based on risk level
    const riskColor = riskLevel === 'Critical' ? '#DC2626' :
        riskLevel === 'High' ? '#EA580C' :
            riskLevel === 'Moderate' ? '#CA8A04' :
                riskLevel === 'Low Risk' ? '#10B981' : '#9CA3AF';

    // Mocking MEWS (Simplified for frontend estimation since backend doesn't return MEWS directly)
    let mewsScore = 0;
    if (latestVital) {
        const rr = parseInt(latestVital.respiratory_rate) || 16;
        const hr = parseInt(latestVital.heart_rate) || 72;
        const temp = parseFloat(latestVital.temperature) || 36.6;
        const spo2 = parseInt(latestVital.spo2) || 98;
        const sbp = parseInt(latestVital.bp_systolic) || 120;
        const am = latestVital.accessory_muscle_use;
        const wob = latestVital.work_of_breathing || 'Normal';
        const borg = parseInt(latestVital.borg_scale) || 0;

        // RR
        if (rr < 9) mewsScore += 2; else if (rr >= 15 && rr <= 20) mewsScore += 1; else if (rr >= 21 && rr <= 29) mewsScore += 2; else if (rr >= 30) mewsScore += 3;
        // HR
        if (hr <= 40) mewsScore += 2; else if (hr >= 41 && hr <= 50) mewsScore += 1; else if (hr >= 101 && hr <= 110) mewsScore += 1; else if (hr >= 111 && hr <= 129) mewsScore += 2; else if (hr >= 130) mewsScore += 3;
        // Temp
        let clinicalTemp = temp;
        if (temp > 70) clinicalTemp = (temp - 32) * 5 / 9;
        if (clinicalTemp < 35) mewsScore += 2; else if (clinicalTemp >= 38.5) mewsScore += 2;
        // SpO2
        if (spo2 < 92) mewsScore += 3; else if (spo2 < 94) mewsScore += 2; else if (spo2 < 96) mewsScore += 1;
        // SBP
        if (sbp < 70) mewsScore += 3; else if (sbp <= 80) mewsScore += 2; else if (sbp <= 100) mewsScore += 1;
        // AM/WOB/Borg
        if (am === "1" || am === 1 || am === true) mewsScore += 2;
        if (wob === 'Mild') mewsScore += 1; else if (wob === 'Moderate') mewsScore += 2; else if (wob === 'Severe') mewsScore += 3;
        if (borg >= 7) mewsScore += 3; else if (borg >= 5) mewsScore += 2; else if (borg >= 3) mewsScore += 1;
    }

    const fio2Decimal = (latestVital?.fio2 || 21) / 100;
    const spo2Fio2 = latestVital ? Math.round(latestVital.spo2 / fio2Decimal) : 0;

    const now = new Date();
    const pad = (n) => n.toString().padStart(2, '0');
    const localToday = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;

    const todayAssessments = vitalsData.filter(v => {
        const dateStr = v.created_at || v.recorded_at || '';
        return dateStr.startsWith(localToday);
    }).length;

    const params = [
        { key: 'spo2', label: 'SpO₂' },
        { key: 'rr', label: 'RR' },
        { key: 'hr', label: 'HR' },
        { key: 'bp', label: 'BP' },
        { key: 'temp', label: 'Temp' },
    ];
    const vitals = [
        { icon: Droplet, title: 'SpO₂', value: latestVital ? `${latestVital.spo2}%` : '—', color: '#10B981' },
        { icon: Wind, title: 'RR', value: latestVital?.respiratory_rate ? `${latestVital.respiratory_rate}` : '—', color: '#10B981' },
        { icon: Heart, title: 'HR', value: latestVital?.heart_rate ? `${latestVital.heart_rate}` : '—', color: '#EC4899' },
        { icon: Activity, title: 'BP', value: latestVital?.bp_systolic ? `${latestVital.bp_systolic}/${latestVital.bp_diastolic}` : '—', color: '#7C3AED' },
        { icon: Thermometer, title: 'Temp', value: latestVital?.temperature ? `${Number(latestVital.temperature).toFixed(1)}°C` : '—', color: '#F59E0B' },
        { icon: Gauge, title: 'Borg', value: latestVital?.borg_scale ? `${latestVital.borg_scale}/10` : '—', color: '#34C759' },
    ];

    const getMewsColor = () => {
        if (mewsScore >= 7) return '#EF4444';
        if (mewsScore >= 5) return '#F59E0B';
        if (mewsScore >= 3) return '#FBBF24';
        return '#10B981';
    };

    const getMewsLabel = () => {
        if (mewsScore >= 7) return 'Critical';
        if (mewsScore >= 5) return 'High Risk';
        if (mewsScore >= 3) return 'Moderate';
        return 'Normal';
    };

    const getSpo2Color = () => {
        if (spo2Fio2 < 200) return '#EF4444';
        if (spo2Fio2 < 300) return '#F59E0B';
        return '#10B981';
    };

    return (
        <div className="ai-risk">
            <button className="ai-risk__back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Back
            </button>
            <h1>AI Analysis</h1>

            {/* Risk Status Card */}
            <div className="ai-risk__status" style={{ background: `linear-gradient(135deg, ${riskColor}, ${riskColor}CC)` }}>
                <div className="ai-risk__status-top">
                    <div>
                        <span className="ai-risk__status-label">Current Risk Level</span>
                        <h2 className="ai-risk__status-level">{riskLevel}</h2>
                    </div>
                    <ShieldCheck size={50} className="ai-risk__status-icon" />
                </div>
                <div className="ai-risk__status-divider" />
                <div className="ai-risk__status-bottom">
                    <div>
                        <span className="ai-risk__trend-label">Trend</span>
                        <div className="ai-risk__trend">
                            <TrendingUp size={16} /> {vitalsData.length >= 3 ? 'Calculated' : 'Stable'}
                        </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                        <span className="ai-risk__trend-label">Last Updated</span>
                        <div className="ai-risk__trend">
                            {latestVital ? (latestVital.recorded_at || 'Recently') : 'No Data'}
                        </div>
                    </div>
                </div>
            </div>

            {/* MEWS / SpO2/FiO2 / Assessments */}
            <div className="ai-risk__scores">
                <div className="ai-risk__score-card">
                    <span className="ai-risk__score-label">MEWS</span>
                    <div className="ai-risk__mews-ring">
                        <svg viewBox="0 0 80 80">
                            <circle cx="40" cy="40" r="34" fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="7" />
                            <circle cx="40" cy="40" r="34" fill="none" stroke={getMewsColor()} strokeWidth="7" strokeLinecap="round"
                                strokeDasharray={`${(mewsScore / 14) * 213.6} 213.6`} transform="rotate(-90 40 40)" />
                        </svg>
                        <span className="ai-risk__mews-value" style={{ color: getMewsColor() }}>{mewsScore}</span>
                    </div>
                    <span className="ai-risk__score-sub">{getMewsLabel()}</span>
                </div>
                <div className="ai-risk__score-divider" />
                <div className="ai-risk__score-card">
                    <span className="ai-risk__score-label">SpO₂/FiO₂</span>
                    <span className="ai-risk__score-big" style={{ color: getSpo2Color() }}>{spo2Fio2}</span>
                    <span className="ai-risk__score-sub">
                        {spo2Fio2 < 200 ? 'ARDS' : 
                         spo2Fio2 < 300 ? 'ALI' : 
                         (riskLevel === 'Critical' && spo2Fio2 >= 300) ? 'Compensated' : 'Normal'}
                    </span>
                </div>
                <div className="ai-risk__score-divider" />
                <div className="ai-risk__score-card">
                    <span className="ai-risk__score-label">Today</span>
                    <span className="ai-risk__score-big" style={{ color: '#0066CC' }}>{todayAssessments}</span>
                    <span className="ai-risk__score-sub">Assessments</span>
                </div>
            </div>

            {/* Trend Analysis */}
            <div className="ai-risk__section">
                <div className="ai-risk__section-header">
                    <h3>Trend Analysis</h3>
                    <div className="ai-risk__param-selector">
                        {params.map(p => (
                            <button key={p.key} className={`ai-risk__param-btn ${selectedParam === p.key ? 'ai-risk__param-btn--active' : ''}`}
                                onClick={() => setSelectedParam(p.key)}>{p.label}</button>
                        ))}
                    </div>
                </div>
                <div className="ai-risk__chart-area" style={{ marginTop: '20px', minHeight: '180px', position: 'relative', overflow: 'hidden' }}>
                    {vitalsData.length >= 1 ? (() => {
                        // Gather and filter data points
                        const sortedData = [...vitalsData]
                            .sort((a, b) => new Date(a.created_at || a.recorded_at) - new Date(b.created_at || b.recorded_at));
                        
                        // Extract points and filter out zeros/nulls
                        const rawPoints = sortedData.map(v => {
                            let val = 0;
                            if (selectedParam === 'spo2') val = parseInt(v.spo2);
                            else if (selectedParam === 'rr') val = parseInt(v.respiratory_rate || v.rr || 0);
                            else if (selectedParam === 'hr') val = parseInt(v.heart_rate || v.hr || 0);
                            else if (selectedParam === 'bp') val = parseInt(v.bp_systolic || v.systolic_bp || 0);
                            else if (selectedParam === 'temp') val = parseFloat(v.temperature || v.temp || 0);
                            
                            return { val, time: new Date(v.created_at || v.recorded_at) };
                        }).filter(p => p.val > 0);

                        if (rawPoints.length === 0) return (
                            <div className="ai-risk__chart-placeholder">
                                <span>No valid trend data found</span>
                            </div>
                        );

                        // Set up domains (matching iOS but refined for web)
                        const getYDomain = (param) => {
                            switch(param) {
                                case 'spo2': return [80, 102]; // More focused on normal range
                                case 'rr': return [8, 35];
                                case 'hr': return [40, 160];
                                case 'bp': return [70, 200];
                                case 'temp': return [35, 41];
                                default: return [0, 100];
                            }
                        };

                        const [minV, maxV] = getYDomain(selectedParam);
                        const rangeV = maxV - minV;

                        // Dimensions
                        const W = 600, H = 160, PX = 45, PY = 25;

                        const points = rawPoints.map((p, i) => {
                            // Clamp value within visible range for cleaner lines
                            const clampedVal = Math.max(minV, Math.min(maxV, p.val));
                            return {
                                val: p.val,
                                isObserved: p.val >= minV && p.val <= maxV,
                                timeStr: p.time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                                x: PX + (rawPoints.length > 1 ? (i / (rawPoints.length - 1)) * (W - 2 * PX) : (W / 2 - PX)),
                                y: PY + (1 - (clampedVal - minV) / rangeV) * (H - 2 * PY),
                            };
                        });

                        const areaColor = selectedParam === 'spo2' ? '#DC2626' : selectedParam === 'hr' ? '#EC4899' : selectedParam === 'rr' ? '#0066CC' : selectedParam === 'bp' ? '#7C3AED' : '#F59E0B';
                        
                        let linePath = "";
                        let areaPath = "";
                        
                        if (points.length > 1) {
                            linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                            areaPath = `${linePath} L ${points[points.length - 1].x} ${H - PY} L ${points[0].x} ${H - PY} Z`;
                        }

                        // Grid lines
                        const gridValues = [minV, maxV];
                        if (selectedParam === 'spo2') {
                            gridValues.push(94); // Clinical threshold
                            if (!gridValues.includes(90)) gridValues.push(90);
                        } else {
                            gridValues.push((minV + maxV) / 2);
                        }

                        return (
                            <div style={{ width: '100%', height: '100%' }}>
                                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'hidden' }}>
                                    <defs>
                                        <linearGradient id="chartGradientWeb" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="0%" stopColor={areaColor} stopOpacity="0.25" />
                                            <stop offset="100%" stopColor={areaColor} stopOpacity="0.02" />
                                        </linearGradient>
                                    </defs>

                                    {/* Grid Lines */}
                                    {gridValues.map((gv, idx) => {
                                        const gy = PY + (1 - (gv - minV) / rangeV) * (H - 2 * PY);
                                        return (
                                            <g key={`grid-${idx}`}>
                                                <line x1={PX} y1={gy} x2={W - PX} y2={gy} stroke="var(--border-light)" strokeWidth="1" strokeDasharray={gv === 94 || gv === 90 ? "4 4" : "0"} strokeOpacity="0.4" />
                                                <text x={PX - 8} y={gy + 4} textAnchor="end" fontSize="10" fontWeight="600" fill="var(--text-muted)">{Math.round(gv)}</text>
                                            </g>
                                        );
                                    })}

                                    {/* Area and Line */}
                                    {points.length > 1 && (
                                        <>
                                            <path d={areaPath} fill="url(#chartGradientWeb)" />
                                            <path d={linePath} fill="none" stroke={areaColor} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                                        </>
                                    )}

                                    {/* Points */}
                                    {points.map((p, i) => (
                                        <g key={i}>
                                            <circle cx={p.x} cy={p.y} r="5" fill={areaColor} stroke="#fff" strokeWidth="2" />
                                            {/* Time labels for important points */}
                                            {(i === 0 || i === points.length - 1 || (points.length > 5 && i === Math.floor(points.length / 2))) && (
                                                <text x={p.x} y={H - 5} textAnchor="middle" fontSize="9" fontWeight="500" fill="var(--text-muted)">{p.timeStr}</text>
                                            )}
                                        </g>
                                    ))}
                                </svg>
                            </div>
                        );
                    })() : (
                        <div className="ai-risk__chart-placeholder">
                            <Activity size={32} style={{ color: 'var(--text-muted)' }} />
                            <span>Not enough trend data</span>
                            <span className="ai-risk__chart-hint">Record at least 2 assessments to see trends</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Clinical Suggestions */}
            {latestVital && (
                <div className="ai-risk__section">
                    <h3 className="ai-risk__suggestions-title">
                        <Lightbulb size={18} style={{ color: '#F59E0B' }} /> Clinical Suggestions
                    </h3>
                    <div className="ai-risk__suggestions">
                        {riskLevel === 'Low Risk' ? (
                            <>
                                <div className="ai-risk__suggestion">
                                    <span className="ai-risk__suggestion-icon">🫁</span>
                                    <div className="ai-risk__suggestion-content">
                                        <div className="ai-risk__suggestion-top">
                                            <span className="ai-risk__suggestion-title">Continue Deep Breathing</span>
                                            <span className="ai-risk__suggestion-badge" style={{ background: '#10B98115', color: '#10B981' }}>Supportive</span>
                                        </div>
                                        <p className="ai-risk__suggestion-desc">Practice 4-7-8 breathing technique for 5 minutes twice daily.</p>
                                    </div>
                                </div>
                                <div className="ai-risk__suggestion">
                                    <span className="ai-risk__suggestion-icon">💧</span>
                                    <div className="ai-risk__suggestion-content">
                                        <div className="ai-risk__suggestion-top">
                                            <span className="ai-risk__suggestion-title">Stay Hydrated</span>
                                            <span className="ai-risk__suggestion-badge" style={{ background: '#10B98115', color: '#10B981' }}>Wellness</span>
                                        </div>
                                        <p className="ai-risk__suggestion-desc">Adequate hydration helps maintain healthy oxygen transport throughout your body.</p>
                                    </div>
                                </div>
                            </>
                        ) : riskLevel === 'Critical' ? (
                            <div className="ai-risk__suggestion">
                                <span className="ai-risk__suggestion-icon">🚑</span>
                                <div className="ai-risk__suggestion-content">
                                    <div className="ai-risk__suggestion-top">
                                        <span className="ai-risk__suggestion-title">Seek Immediate Help</span>
                                        <span className="ai-risk__suggestion-badge" style={{ background: '#DC262615', color: '#DC2626' }}>Urgent</span>
                                    </div>
                                    <p className="ai-risk__suggestion-desc">Your vitals indicate severe abnormality. Please visit the nearest emergency department or call an ambulance immediately.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="ai-risk__suggestion">
                                <span className="ai-risk__suggestion-icon">🩺</span>
                                <div className="ai-risk__suggestion-content">
                                    <div className="ai-risk__suggestion-top">
                                        <span className="ai-risk__suggestion-title">Monitor Closely</span>
                                        <span className="ai-risk__suggestion-badge" style={{ background: '#F59E0B15', color: '#F59E0B' }}>Action Needed</span>
                                    </div>
                                    <p className="ai-risk__suggestion-desc">Your vitals are showing signs of decline. Consult your primary care physician soon and keep recording your vitals hourly.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Latest Vitals */}
            <div className="ai-risk__section">
                <h3>Latest Assessment</h3>
                <div className="ai-risk__vitals-grid">
                    {vitals.map((v, i) => (
                        <div key={i} className="ai-risk__vital-badge" style={{ background: `${v.color}12` }}>
                            <v.icon size={18} style={{ color: v.color }} />
                            <span className="ai-risk__vital-value">{v.value}</span>
                            <span className="ai-risk__vital-label">{v.title}</span>
                        </div>
                    ))}
                </div>

                {latestVital && (
                    <div className="vitals-respiratory-footer" style={{ marginTop: '16px', display: 'flex', gap: '16px', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Wind size={14} /> WOB: {latestVital.work_of_breathing || 'Normal'}
                        </span>
                        {(latestVital.accessory_muscle_use === "1" || latestVital.accessory_muscle_use === 1) && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EA580C' }}>
                                <AlertTriangle size={14} /> Accessory Muscles
                            </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Droplet size={14} /> FiO₂: {Math.round(latestVital.fio2 || 21)}%
                        </span>
                        {latestVital.oxygen_flow && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Activity size={14} /> Flow: {latestVital.oxygen_flow} L/min
                            </span>
                        )}
                        <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
                            {latestVital.oxygen_device || 'Room Air'}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
