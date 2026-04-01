import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { ChevronLeft, User, Send, Search, CheckCircle2 } from 'lucide-react';
import './ShareVitalsPage.css';

// API_BASE is handled centrally in api.js
  
export default function ShareVitalsPage() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [sharingId, setSharingId] = useState(null);
    const [sharedIds, setSharedIds] = useState(new Set());

    useEffect(() => {
        loadDoctors();
    }, []);

    const loadDoctors = async () => {
        setIsLoading(true);
        try {
            const data = await api.fetchDoctors();
            setDoctors(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error('Error loading doctors:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const handleShare = async (doctor) => {
        setSharingId(doctor.id);
        try {
            await api.shareVitals(user.id, doctor.id);
            setSharedIds(prev => new Set([...prev, doctor.id]));
        } catch (err) {
            console.error('Failed to share vitals:', err);
            alert('Failed to share vitals. Please try again.');
        } finally {
            setSharingId(null);
        }
    };

    const filteredDoctors = doctors.filter(doc =>
        doc.name.toLowerCase().includes(searchQuery.toLowerCase())
    );


    return (
        <div className="share-vitals">
            <header className="share-vitals__header">
                <button className="share-vitals__back" onClick={() => navigate(-1)}>
                    <ChevronLeft size={20} /> Back
                </button>
                <h1>Share Vitals</h1>
                <p>Select a healthcare provider to share your latest health data</p>
            </header>

            <div className="share-vitals__search">
                <Search size={18} className="share-vitals__search-icon" />
                <input
                    type="text"
                    placeholder="Search doctors by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>

            {isLoading ? (
                <div className="share-vitals__loading">
                    <div className="vitals-spinner" />
                    <p>Fetching doctors...</p>
                </div>
            ) : (
                <div className="share-vitals__grid">
                    {filteredDoctors.length > 0 ? (
                        filteredDoctors.map(doc => (
                            <div key={doc.id} className="doctor-share-card">
                                <div className="doctor-share-card__avatar">
                                    {doc.photo_url ? (
                                        <img src={api.getPhotoUrl(doc.photo_url)} alt={doc.name} />
                                    ) : (
                                        <div className="doctor-share-card__placeholder">
                                            <User size={24} />
                                        </div>
                                    )}
                                </div>
                                <div className="doctor-share-card__info">
                                    <span className="doctor-share-card__name">Dr. {doc.name}</span>
                                    <span className="doctor-share-card__specialty">Pulmonologist</span>
                                </div>
                                <button
                                    className={`doctor-share-card__btn ${sharedIds.has(doc.id) ? 'doctor-share-card__btn--success' : ''}`}
                                    onClick={() => handleShare(doc)}
                                    disabled={sharingId === doc.id || sharedIds.has(doc.id)}
                                >
                                    {sharingId === doc.id ? (
                                        'Sharing...'
                                    ) : sharedIds.has(doc.id) ? (
                                        <><CheckCircle2 size={16} /> Shared</>
                                    ) : (
                                        <><Send size={16} /> Share Now</>
                                    )}
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="share-vitals__empty">
                            <User size={48} />
                            <p>No doctors found matching your search.</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
