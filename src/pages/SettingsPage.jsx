import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Key, Sun, Moon, Monitor, Bell, TrendingUp, FileText, Shield, HelpCircle, LogOut, Trash2, ChevronRight, Palette } from 'lucide-react';
import './SettingsPage.css';

export default function SettingsPage() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [theme, setTheme] = useState(0);
    const [accentColor, setAccentColor] = useState(localStorage.getItem('accentColor') || 'blue');
    const [notifications, setNotifications] = useState(true);
    const [showTrends, setShowTrends] = useState(true);
    const [showLogout, setShowLogout] = useState(false);
    const [showDelete, setShowDelete] = useState(false);

    const handleLogout = () => { logout(); navigate('/login'); };
    const themeLabels = ['System', 'Light', 'Dark'];
    const themeIcons = [Monitor, Sun, Moon];
    const ThemeIcon = themeIcons[theme];

    const handleThemeChange = () => {
        const next = (theme + 1) % 3;
        setTheme(next);
        document.documentElement.setAttribute('data-theme', next === 2 ? 'dark' : '');
    };

    const handleAccentChange = (colorKey) => {
        setAccentColor(colorKey);
        localStorage.setItem('accentColor', colorKey);
        if (colorKey !== 'blue') {
            document.documentElement.setAttribute('data-accent', colorKey);
        } else {
            document.documentElement.removeAttribute('data-accent');
        }
    };

    const accents = [
        { key: 'blue', color: '#0066CC', name: 'Blue' },
        { key: 'green', color: '#10B981', name: 'Green' },
        { key: 'purple', color: '#7C3AED', name: 'Purple' },
        { key: 'rose', color: '#EC4899', name: 'Rose' },
        { key: 'orange', color: '#F59E0B', name: 'Orange' },
        { key: 'teal', color: '#14B8A6', name: 'Teal' }
    ];

    return (
        <div className="settings-page">
            <h1>Settings</h1>

            {/* Account */}
            <div className="settings-section">
                <span className="settings-section__title">Account</span>
                <div className="settings-section__card">
                    <button className="settings-item" onClick={() => navigate('/dashboard/profile')}>
                        <User size={18} className="settings-item__icon" />
                        <span>Profile</span>
                        <ChevronRight size={16} className="settings-item__chevron" />
                    </button>
                    <div className="settings-divider" />
                    <button className="settings-item" onClick={() => { }}>
                        <Key size={18} className="settings-item__icon" />
                        <span>Change Password</span>
                        <ChevronRight size={16} className="settings-item__chevron" />
                    </button>
                </div>
            </div>

            {/* Appearance */}
            <div className="settings-section">
                <span className="settings-section__title">Appearance</span>
                <div className="settings-section__card">
                    <button className="settings-item" onClick={handleThemeChange}>
                        <ThemeIcon size={18} className="settings-item__icon" />
                        <span>Theme</span>
                        <span className="settings-item__value">{themeLabels[theme]}</span>
                    </button>
                    <div className="settings-divider" />
                    <div className="settings-item" style={{ cursor: 'default' }}>
                        <Palette size={18} className="settings-item__icon" />
                        <span>Accent Color</span>
                    </div>
                    <div style={{ padding: '0 16px 16px 46px', display: 'flex', gap: '12px' }}>
                        {accents.map(acc => (
                            <button
                                key={acc.key}
                                onClick={() => handleAccentChange(acc.key)}
                                style={{
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '50%',
                                    background: acc.color,
                                    border: accentColor === acc.key ? '3px solid var(--bg-primary)' : '2px solid transparent',
                                    boxShadow: accentColor === acc.key ? `0 0 0 2px ${acc.color}` : 'none',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0
                                }}
                                title={acc.name}
                            />
                        ))}
                    </div>
                </div>
            </div>

            {/* Preferences */}
            <div className="settings-section">
                <span className="settings-section__title">App Preferences</span>
                <div className="settings-section__card">
                    <div className="settings-item">
                        <Bell size={18} className="settings-item__icon" />
                        <span>AI Alerts / Notifications</span>
                        <label className="settings-toggle">
                            <input type="checkbox" checked={notifications} onChange={(e) => setNotifications(e.target.checked)} />
                            <span className="settings-toggle__slider" />
                        </label>
                    </div>
                    <div className="settings-divider" />
                    <div className="settings-item">
                        <TrendingUp size={18} className="settings-item__icon" />
                        <span>Show Trends Graph</span>
                        <label className="settings-toggle">
                            <input type="checkbox" checked={showTrends} onChange={(e) => setShowTrends(e.target.checked)} />
                            <span className="settings-toggle__slider" />
                        </label>
                    </div>
                </div>
            </div>

            {/* About */}
            <div className="settings-section">
                <span className="settings-section__title">About & Support</span>
                <div className="settings-section__card">
                    <button className="settings-item">
                        <FileText size={18} className="settings-item__icon" />
                        <span>Terms & Conditions</span>
                        <ChevronRight size={16} className="settings-item__chevron" />
                    </button>
                    <div className="settings-divider" />
                    <button className="settings-item">
                        <Shield size={18} className="settings-item__icon" />
                        <span>Privacy Policy</span>
                        <ChevronRight size={16} className="settings-item__chevron" />
                    </button>
                    <div className="settings-divider" />
                    <button className="settings-item">
                        <HelpCircle size={18} className="settings-item__icon" />
                        <span>Help & Support</span>
                        <ChevronRight size={16} className="settings-item__chevron" />
                    </button>
                </div>
            </div>

            {/* Danger Zone */}
            <div className="settings-section">
                <div className="settings-section__card">
                    <button className="settings-item settings-item--danger" onClick={() => setShowLogout(true)}>
                        <LogOut size={18} />
                        <span>Logout</span>
                    </button>
                    <div className="settings-divider" />
                    <button className="settings-item settings-item--danger" onClick={() => setShowDelete(true)}>
                        <Trash2 size={18} />
                        <span>Delete Account</span>
                    </button>
                </div>
            </div>

            {/* Logout Confirmation */}
            {showLogout && (
                <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && setShowLogout(false)}>
                    <div className="settings-dialog">
                        <h3>Logout</h3>
                        <p>Are you sure you want to logout?</p>
                        <div className="settings-dialog__actions">
                            <button className="settings-dialog__cancel" onClick={() => setShowLogout(false)}>Cancel</button>
                            <button className="settings-dialog__confirm settings-dialog__confirm--danger" onClick={handleLogout}>Logout</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDelete && (
                <div className="settings-overlay" onClick={(e) => e.target === e.currentTarget && setShowDelete(false)}>
                    <div className="settings-dialog">
                        <h3>Delete Account</h3>
                        <p>This action is permanent and cannot be undone. All your data will be deleted.</p>
                        <div className="settings-dialog__actions">
                            <button className="settings-dialog__cancel" onClick={() => setShowDelete(false)}>Cancel</button>
                            <button className="settings-dialog__confirm settings-dialog__confirm--danger" onClick={() => { setShowDelete(false); }}>Delete</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
