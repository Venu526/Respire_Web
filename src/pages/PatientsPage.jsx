import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import {
    Search, Filter, User, Heart, Wind, Thermometer,
    ChevronRight, AlertCircle, CheckCircle2, MoreVertical,
    FileText, Calendar, MessageSquare
} from 'lucide-react';
import './PatientsPage.css';

export default function PatientsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [patients, setPatients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filter, setFilter] = useState(searchParams.get('filter') || 'all');
    const [activeMenu, setActiveMenu] = useState(null);

    useEffect(() => {
        if (user?.id) {
            loadPatients();
        }
    }, [user]);

    const loadPatients = async () => {
        try {
            setLoading(true);
            const data = await api.fetchDoctorPatients(user?.id);
            setPatients(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to load patients:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMenu = (e, patientId) => {
        e.stopPropagation();
        setActiveMenu(activeMenu === patientId ? null : patientId);
    };

    const filteredPatients = patients.filter(p => {
        const name = p.name || '';
        const email = p.email || '';
        const matchesSearch = name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            email.toLowerCase().includes(searchQuery.toLowerCase());

        if (filter === 'all') return matchesSearch;
        const risk = p.latest_vitals?.risk_level || 'Stable';

        if (filter === 'critical') {
            return matchesSearch && (risk === 'Critical' || risk === 'High Risk' || risk === 'High');
        }
        if (filter === 'moderate') {
            return matchesSearch && (risk === 'Moderate' || risk === 'Moderate Risk' || risk === 'Medium Risk' || risk === 'Medium');
        }
        if (filter === 'stable') {
            return matchesSearch && (risk === 'Stable' || risk === 'Low Risk' || risk === 'Low' || !risk);
        }
        return matchesSearch;
    });

    const getRiskBadgeClass = (risk) => {
        if (!risk || risk === 'Stable' || risk === 'Low Risk' || risk === 'Low') return 'risk-badge--stable';
        if (risk === 'Critical' || risk === 'High Risk' || risk === 'High') return 'risk-badge--critical';
        if (risk === 'Moderate' || risk === 'Moderate Risk' || risk === 'Medium Risk' || risk === 'Medium') return 'risk-badge--moderate';
        return 'risk-badge--stable';
    };

    return (
        <div className="patients-page" onClick={() => setActiveMenu(null)}>
            <header className="patients-page__header">
                <div>
                    <h1 className="patients-page__title">Patient Directory</h1>
                    <p className="patients-page__subtitle">Manage and monitor all registered patients</p>
                </div>
                <div className="patients-page__stats">
                    <div className="patients-page__stat">
                        <span className="patients-page__stat-value">{patients.length}</span>
                        <span className="patients-page__stat-label">Total</span>
                    </div>
                </div>
            </header>

            <div className="patients-page__controls">
                <div className="search-bar">
                    <Search size={18} className="search-bar__icon" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="search-bar__input"
                    />
                </div>
                <div className="filter-chips">
                    <button
                        className={`filter-chip ${filter === 'all' ? 'filter-chip--active' : ''}`}
                        onClick={() => setFilter('all')}
                    >All</button>
                    <button
                        className={`filter-chip ${filter === 'critical' ? 'filter-chip--active-danger' : ''}`}
                        onClick={() => setFilter('critical')}
                    >Critical</button>
                    <button
                        className={`filter-chip ${filter === 'moderate' ? 'filter-chip--active-warning' : ''}`}
                        onClick={() => setFilter('moderate')}
                    >Moderate</button>
                    <button
                        className={`filter-chip ${filter === 'stable' ? 'filter-chip--active-success' : ''}`}
                        onClick={() => setFilter('stable')}
                    >Stable</button>
                </div>
            </div>

            {loading ? (
                <div className="patients-page__loading">
                    <div className="spinner"></div>
                    <p>Loading patient directory...</p>
                </div>
            ) : filteredPatients.length === 0 ? (
                <div className="patients-page__empty">
                    <User size={48} />
                    <p>No patients found matching your criteria.</p>
                </div>
            ) : (
                <div className="patients-grid">
                    {filteredPatients.map(patient => (
                        <div key={patient.id} className="patient-card" onClick={() => navigate(`/dashboard/patients/${patient.id}`)}>
                            <div className="patient-card__header">
                                <div className="patient-card__info">
                                    <div className="patient-card__avatar" style={{ overflow: 'hidden', background: patient.photo_url ? 'transparent' : 'var(--color-primary-light)' }}>
                                        {patient.photo_url ? (
                                            <img src={api.getPhotoUrl(patient.photo_url)} alt={patient.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        ) : (
                                            (patient.name || 'U').split(' ').map(n => n[0]).join('').toUpperCase()
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="patient-card__name">{patient.name}</h3>
                                        <p className="patient-card__email">{patient.email}</p>
                                    </div>
                                </div>
                                <div className="patient-card__actions">
                                    <button className="patient-card__more" onClick={(e) => toggleMenu(e, patient.id)}>
                                        <MoreVertical size={18} />
                                    </button>
                                    {activeMenu === patient.id && (
                                        <div className="patient-menu">
                                            <button onClick={() => navigate(`/dashboard/patients/${patient.id}`)}>
                                                <FileText size={14} /> Full History
                                            </button>
                                            <button onClick={(e) => { e.stopPropagation(); navigate('/dashboard/appointments'); }}>
                                                <Calendar size={14} /> Book Appt
                                            </button>
                                            <button onClick={(e) => e.stopPropagation()}>
                                                <MessageSquare size={14} /> Send Message
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="patient-card__vitals">
                                <div className="vital-mini">
                                    <Heart size={14} className="vital-mini__icon vital-mini__icon--red" />
                                    <span>{patient.latest_vitals?.heart_rate || '--'} <small>BPM</small></span>
                                </div>
                                <div className="vital-mini">
                                    <Wind size={14} className="vital-mini__icon vital-mini__icon--blue" />
                                    <span>{patient.latest_vitals?.spo2 || '--'}<small>%</small></span>
                                </div>
                                <div className="vital-mini">
                                    <Thermometer size={14} className="vital-mini__icon vital-mini__icon--orange" />
                                    <span>{patient.latest_vitals?.temperature || '--'}<small>°C</small></span>
                                </div>
                            </div>

                            <div className="patient-card__footer">
                                <span className={`risk-badge ${getRiskBadgeClass(patient.latest_vitals?.risk_level)}`}>
                                    {patient.latest_vitals?.risk_level || 'Stable'}
                                </span>
                                <button className="patient-card__action" onClick={(e) => { e.stopPropagation(); navigate(`/dashboard/patients/${patient.id}`); }}>
                                    View Details <ChevronRight size={14} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

