import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ChevronLeft, Activity, Wind, Heart, Droplet, Thermometer, AlertTriangle, ShieldCheck, AlertCircle, Zap } from 'lucide-react';
import { determineRiskLevel } from '../utils/AIPredictionService';
import { VITAL_LIMITS, validateVital } from '../utils/validationUtils';
import InputField from '../components/InputField';
import GradientButton from '../components/GradientButton';
import './AddVitalsPage.css';

export default function AddVitalsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [activeSection, setActiveSection] = useState('primary');

    // Primary Vitals State
    const [spo2, setSpo2] = useState('');
    const [rr, setRr] = useState('');
    const [hr, setHr] = useState('');
    const [bp, setBp] = useState('');
    const [temp, setTemp] = useState('');

    // Oxygen Support State
    const [oxygenDevice, setOxygenDevice] = useState('Room Air');
    const [oxygenFlow, setOxygenFlow] = useState('');
    const [fio2, setFio2] = useState('21');

    // Respiratory State
    const [workOfBreathing, setWorkOfBreathing] = useState('Normal');
    const [accessoryMuscleUse, setAccessoryMuscleUse] = useState(false);
    const [borgScale, setBorgScale] = useState(0);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [estimatedRisk, setEstimatedRisk] = useState('Low Risk');

    // Real-time Risk Estimation
    const currentVitals = {
        spo2,
        respiratory_rate: rr,
        heart_rate: hr,
        bp_systolic: bp.split('/')[0] || '',
        temperature: temp,
        work_of_breathing: workOfBreathing,
        accessory_muscle_use: accessoryMuscleUse,
        borg_scale: borgScale
    };

    const calculateRisk = () => {
        // Only calculate if at least one vital is entered
        if (!spo2 && !rr && !hr && !bp && !temp) {
            setEstimatedRisk('Enter Vitals');
            return;
        }
        const risk = determineRiskLevel(currentVitals);
        setEstimatedRisk(risk);
    };

    // Recalculate whenever inputs change
    useEffect(() => {
        calculateRisk();
    }, [spo2, rr, hr, bp, temp, workOfBreathing, accessoryMuscleUse, borgScale]);

    const getRiskStyles = (risk) => {
        switch (risk) {
            case 'Critical': return { color: '#FF3B30', bg: '#FF3B3015', icon: <Zap size={18} /> };
            case 'High': return { color: '#FF9500', bg: '#FF950015', icon: <AlertCircle size={18} /> };
            case 'Moderate': return { color: '#FFCC00', bg: '#FFCC0018', icon: <AlertTriangle size={18} /> };
            case 'Low Risk': return { color: '#34C759', bg: '#34C75915', icon: <ShieldCheck size={18} /> };
            default: return { color: '#8E8E93', bg: '#F2F2F7', icon: <Activity size={18} /> };
        }
    };

    const getErrors = () => {
        const errs = {};
        
        const rrErr = validateVital('rr', rr);
        if (rrErr) errs.rr = rrErr;

        const spo2Err = validateVital('spo2', spo2);
        if (spo2Err) errs.spo2 = spo2Err;

        const hrErr = validateVital('hr', hr);
        if (hrErr) errs.hr = hrErr;

        if (bp) {
            const bpRegex = /^\d{2,3}\/\d{2,3}$/;
            if (!bpRegex.test(bp)) {
                errs.bp = 'Use format: 120/80';
            } else {
                const parts = bp.split('/');
                const sys = parseInt(parts[0]);
                const dia = parseInt(parts[1]);
                const sysErr = validateVital('systolic_bp', sys);
                const diaErr = validateVital('diastolic_bp', dia);
                
                if (sysErr) errs.bp = sysErr;
                else if (diaErr) errs.bp = diaErr;
                else if (dia >= sys) errs.bp = 'Diastolic must be less than systolic';
            }
        }

        const tempErr = validateVital('temp', temp);
        if (tempErr) errs.temp = tempErr;

        if (oxygenFlow) {
            const flowErr = validateVital('oxygen_flow', oxygenFlow);
            if (flowErr) errs.oxygenFlow = flowErr;
        }

        if (fio2 && oxygenDevice !== 'Room Air') {
            const fio2Err = validateVital('fio2', fio2);
            if (fio2Err) errs.fio2 = fio2Err;
        }

        return errs;
    };

    const getInputStatus = (param, value) => {
        if (!value) return 'normal';
        const num = Number(value);
        if (isNaN(num)) return 'normal';

        if (param === 'spo2') {
            if (num < 92) return 'critical';
            if (num < 94) return 'warning';
        } else if (param === 'rr') {
            if (num >= 30 || num < 9) return 'critical';
            if (num >= 21) return 'warning';
        } else if (param === 'hr') {
            if (num >= 130 || num < 40) return 'critical';
            if (num >= 111 || num <= 50) return 'warning';
        } else if (param === 'temp') {
            let clinicalTemp = num;
            if (num > 70) clinicalTemp = (num - 32) * 5 / 9;
            if (clinicalTemp >= 38.5 || clinicalTemp < 35.0) return 'warning';
        }
        return 'normal';
    };

    const fieldErrors = getErrors();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        
        // Basic validation: user should enter at least one primary vital if they are just saving,
        // or they can save mostly respiratory stuff. We'll require at least one key primary vital.
        if (!spo2 && !rr && !hr && !bp && !temp && oxygenDevice === 'Room Air' && workOfBreathing === 'Normal') {
            setError('Please enter at least one vital sign or assessment data');
            return;
        }
        
        if (Object.keys(fieldErrors).length > 0) {
            setError('Please fix the errors before saving');
            return;
        }

        setLoading(true);
        try {
            let bp_systolic = null;
            let bp_diastolic = null;
            if (bp) {
                const bpParts = bp.split('/');
                bp_systolic = bpParts[0]?.trim() || null;
                bp_diastolic = bpParts[1]?.trim() || null;
            }

            // Generate local timestamp matching iOS format to prevent timezone desync
            const now = new Date();
            const pad = (n) => n.toString().padStart(2, '0');
            const localTimestamp = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

            await api.addVitals({
                user_id: user?.id,
                spo2: spo2 || null,
                respiratory_rate: rr || null,
                heart_rate: hr || null,
                bp_systolic,
                bp_diastolic,
                temperature: temp || null,
                
                // New Fields
                oxygen_device: oxygenDevice,
                oxygen_flow: oxygenFlow || null,
                fio2: fio2 || null,
                work_of_breathing: workOfBreathing,
                accessory_muscle_use: accessoryMuscleUse ? 1 : 0,
                borg_scale: borgScale,
                recorded_at: localTimestamp
            });
            sessionStorage.setItem('has_session_vitals', 'true');
            setSuccess(true);
            setTimeout(() => navigate(-1), 1500);
        } catch (err) {
            setError(err.message || 'Failed to save vitals');
        } finally { setLoading(false); }
    };

    if (success) {
        return (
            <div className="add-vitals">
                <div className="add-vitals__success">
                    <div className="add-vitals__success-icon">✓</div>
                    <h2>Vitals Saved!</h2>
                    <p>Your vitals have been recorded successfully.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="add-vitals">
            <button className="add-vitals__back" onClick={() => navigate(-1)}>
                <ChevronLeft size={20} /> Back
            </button>
            <h1>Add Vitals</h1>
            <p className="add-vitals__subtitle">Enter your current vital signs and respiratory assessment</p>

            <div className="add-vitals__risk-preview" style={{ 
                backgroundColor: getRiskStyles(estimatedRisk).bg,
                color: getRiskStyles(estimatedRisk).color,
                border: `1px solid ${getRiskStyles(estimatedRisk).color}30`
            }}>
                <div className="risk-preview__icon">
                    {getRiskStyles(estimatedRisk).icon}
                </div>
                <div className="risk-preview__text">
                    <span className="risk-preview__label">Estimated Clinical Status</span>
                    <span className="risk-preview__value">{estimatedRisk}</span>
                </div>
            </div>

            <div className="add-vitals__tabs">
                <button 
                    type="button"
                    className={`nav-tab ${activeSection === 'primary' ? 'active' : ''}`}
                    onClick={() => setActiveSection('primary')}
                >
                    <Heart size={16} /> Primary Vitals
                </button>
                <button 
                    type="button"
                    className={`nav-tab ${activeSection === 'oxygen' ? 'active' : ''}`}
                    onClick={() => setActiveSection('oxygen')}
                >
                    <AlertTriangle size={16} /> Oxygen Support
                </button>
                <button 
                    type="button"
                    className={`nav-tab ${activeSection === 'respiratory' ? 'active' : ''}`}
                    onClick={() => setActiveSection('respiratory')}
                >
                    <Wind size={16} /> Respiratory
                </button>
            </div>

            {error && <div className="add-vitals__error">⚠ {error}</div>}

            <form className="add-vitals__form" onSubmit={handleSubmit}>
                
                {/* PRIMARY VITALS */}
                {activeSection === 'primary' && (
                    <div className="form-section fade-in">
                        <InputField 
                            label="SpO₂ (%)" 
                            type="number" 
                            value={spo2} 
                            onChange={setSpo2} 
                            placeholder="e.g. 98" 
                            icon={<Droplet size={18} />} 
                            error={fieldErrors.spo2}
                            style={{ borderLeft: getInputStatus('spo2', spo2) !== 'normal' ? `3px solid ${getRiskStyles(getInputStatus('spo2', spo2) === 'critical' ? 'Critical' : 'High').color}` : 'none' }}
                        />
                        <InputField 
                            label="Respiratory Rate (breaths/min)" 
                            type="number" 
                            value={rr} 
                            onChange={setRr} 
                            placeholder="e.g. 16" 
                            icon={<Wind size={18} />} 
                            error={fieldErrors.rr} 
                            style={{ borderLeft: getInputStatus('rr', rr) !== 'normal' ? `3px solid ${getRiskStyles(getInputStatus('rr', rr) === 'critical' ? 'Critical' : 'High').color}` : 'none' }}
                        />
                        <InputField 
                            label="Heart Rate (bpm)" 
                            type="number" 
                            value={hr} 
                            onChange={setHr} 
                            placeholder="e.g. 72" 
                            icon={<Heart size={18} />} 
                            error={fieldErrors.hr} 
                            style={{ borderLeft: getInputStatus('hr', hr) !== 'normal' ? `3px solid ${getRiskStyles(getInputStatus('hr', hr) === 'critical' ? 'Critical' : 'High').color}` : 'none' }}
                        />
                        <InputField label="Blood Pressure (mmHg)" value={bp} onChange={setBp} placeholder="e.g. 120/80" icon={<Activity size={18} />} error={fieldErrors.bp} />
                        <InputField 
                            label="Temperature (°C)" 
                            type="number" 
                            value={temp} 
                            onChange={setTemp} 
                            placeholder="e.g. 36.6" 
                            icon={<Thermometer size={18} />} 
                            step={0.1} 
                            error={fieldErrors.temp} 
                        />
                    </div>
                )}

                {/* OXYGEN SUPPORT */}
                {activeSection === 'oxygen' && (
                    <div className="form-section fade-in">
                        <div className="input-field-group">
                            <label className="input-field__label">Oxygen Device Type</label>
                            <select 
                                className="add-vitals__select"
                                value={oxygenDevice}
                                onChange={(e) => {
                                    setOxygenDevice(e.target.value);
                                    if (e.target.value === 'Room Air') setFio2('21');
                                }}
                            >
                                <option value="Room Air">Room Air</option>
                                <option value="Nasal Cannula (NC)">Nasal Cannula (NC)</option>
                                <option value="Simple Face Mask">Simple Face Mask</option>
                                <option value="Non-Rebreather Mask (NRBM)">Non-Rebreather Mask (NRBM)</option>
                                <option value="Venturi Mask">Venturi Mask</option>
                                <option value="High Flow NC (HFNC)">High Flow NC (HFNC)</option>
                                <option value="BiPAP">BiPAP</option>
                                <option value="CPAP">CPAP</option>
                                <option value="Mechanical Ventilator">Mechanical Ventilator</option>
                            </select>
                        </div>

                        {oxygenDevice !== 'Room Air' && (
                            <>
                                <InputField 
                                    label="Oxygen Flow Rate (L/min)" 
                                    type="number" 
                                    value={oxygenFlow} 
                                    onChange={setOxygenFlow} 
                                    placeholder="e.g. 2" 
                                    step={0.5} 
                                    error={fieldErrors.oxygenFlow}
                                />
                                <InputField 
                                    label="FiO₂ (%)" 
                                    type="number" 
                                    value={fio2} 
                                    onChange={setFio2} 
                                    placeholder="e.g. 40" 
                                    error={fieldErrors.fio2}
                                />
                            </>
                        )}
                    </div>
                )}

                {/* RESPIRATORY ASSESSMENT */}
                {activeSection === 'respiratory' && (
                    <div className="form-section fade-in">
                        <div className="input-field-group">
                            <label className="input-field__label">Work of Breathing</label>
                            <select 
                                className="add-vitals__select"
                                value={workOfBreathing}
                                onChange={(e) => setWorkOfBreathing(e.target.value)}
                            >
                                <option value="Normal">Normal</option>
                                <option value="Mild">Mild</option>
                                <option value="Moderate">Moderate</option>
                                <option value="Severe">Severe</option>
                            </select>
                        </div>

                        <div className="input-field-group checkbox-group">
                            <label className="checkbox-label">
                                <input 
                                    type="checkbox" 
                                    checked={accessoryMuscleUse}
                                    onChange={(e) => setAccessoryMuscleUse(e.target.checked)}
                                />
                                <span className="custom-checkbox"></span>
                                Accessory Muscle Use (Using neck/shoulder muscles to breathe)
                            </label>
                        </div>

                        <div className="input-field-group slider-group">
                            <div className="slider-header">
                                <label className="input-field__label">Borg Dyspnea Scale</label>
                                <span className="slider-value">{borgScale} / 10</span>
                            </div>
                            <p className="slider-desc">How severe is the shortness of breath?</p>
                            <input 
                                type="range" 
                                min="0" 
                                max="10" 
                                step="1"
                                className={`borg-slider borg-color-${borgScale}`}
                                value={borgScale}
                                onChange={(e) => setBorgScale(parseInt(e.target.value))}
                            />
                            <div className="slider-labels">
                                <span>0 - Nothing</span>
                                <span>10 - Max</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="add-vitals__actions" style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    {activeSection === 'primary' && (
                        <GradientButton 
                            className="add-vitals__submit-btn" 
                            type="button" 
                            onClick={(e) => { e.preventDefault(); setActiveSection('oxygen'); }}
                        >
                            Next: Oxygen Support
                        </GradientButton>
                    )}
                    
                    {activeSection === 'oxygen' && (
                        <>
                            <button 
                                type="button" 
                                className="nav-tab active" 
                                style={{ flex: '1', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '14px', fontWeight: '600' }}
                                onClick={() => setActiveSection('primary')}
                            >
                                Back
                            </button>
                            <GradientButton 
                                className="add-vitals__submit-btn" 
                                style={{ flex: '2' }}
                                type="button" 
                                onClick={(e) => { e.preventDefault(); setActiveSection('respiratory'); }}
                            >
                                Next: Respiratory
                            </GradientButton>
                        </>
                    )}

                    {activeSection === 'respiratory' && (
                        <>
                            <button 
                                type="button" 
                                className="nav-tab active" 
                                style={{ flex: '1', backgroundColor: '#e5e7eb', color: '#374151', border: 'none', borderRadius: '14px', fontWeight: '600' }}
                                onClick={() => setActiveSection('oxygen')}
                            >
                                Back
                            </button>
                            <GradientButton 
                                className="add-vitals__submit-btn" 
                                style={{ flex: '2' }}
                                type="submit" 
                                loading={loading}
                            >
                                Save All Vitals
                            </GradientButton>
                        </>
                    )}
                </div>
            </form>
        </div>
    );
}

