import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import {
    Home, Activity, Wind, Brain, Target, User, Settings,
    LogOut, Menu, X, Stethoscope, Bell, Calendar
} from 'lucide-react';
import { useState } from 'react';
import './DashboardPage.css';

export default function DashboardLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const isDoctor = user?.role === 'doctor';
    const initials = user?.name ? user.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'U';

    const patientNavItems = [
        { to: '/dashboard', icon: Home, label: 'Home', end: true },
        { to: '/dashboard/vitals', icon: Activity, label: 'Vitals' },
        { to: '/dashboard/doctor', icon: Stethoscope, label: 'Doctor' },
        { to: '/dashboard/breathing', icon: Wind, label: 'Breathing' },
        { to: '/dashboard/ai-risk', icon: Brain, label: 'AI Analysis' },
        { to: '/dashboard/goals', icon: Target, label: 'Goals' },
        { to: '/dashboard/profile', icon: User, label: 'Profile' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];

    const doctorNavItems = [
        { to: '/dashboard', icon: Home, label: 'Dashboard', end: true },
        { to: '/dashboard/patients', icon: Activity, label: 'Patients' },
        { to: '/dashboard/alerts', icon: Bell, label: 'Alerts' },
        { to: '/dashboard/appointments', icon: Calendar, label: 'Appts' },
        { to: '/dashboard/profile', icon: User, label: 'Profile' },
        { to: '/dashboard/settings', icon: Settings, label: 'Settings' },
    ];

    const navItems = isDoctor ? doctorNavItems : patientNavItems;

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-layout">
            {/* Desktop Sidebar */}
            <aside className="dashboard-sidebar">
                <div className="dashboard-sidebar__brand">
                    <div className="dashboard-sidebar__logo" style={{ background: isDoctor ? 'var(--color-success)' : 'var(--color-primary)' }}>
                        <Activity size={20} />
                    </div>
                    <span className="dashboard-sidebar__title">RespireAI</span>
                    {isDoctor && <span className="dashboard-sidebar__badge">PRO</span>}
                </div>

                <nav className="dashboard-sidebar__nav">
                    {navItems.map(item => (
                        <NavLink key={item.to} to={item.to} end={item.end}
                            className={({ isActive }) => `dashboard-sidebar__link ${isActive ? 'dashboard-sidebar__link--active' : ''}`}>
                            <item.icon size={18} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <div className="dashboard-sidebar__footer">
                    <div className="dashboard-sidebar__user">
                        <div className="dashboard-sidebar__avatar" style={{
                            background: (isDoctor && !user?.photo_url)
                                ? 'linear-gradient(135deg, #10B981, #059669)'
                                : (!isDoctor && !user?.photo_url) ? 'linear-gradient(135deg, #0066CC, #0088E0)' : 'transparent'
                        }}>
                            {user?.photo_url ? (
                                <img src={api.getPhotoUrl(user.photo_url)} alt={user.name} className="dashboard-sidebar__avatar-img" />
                            ) : initials}
                        </div>
                        <div className="dashboard-sidebar__user-info">
                            <span className="dashboard-sidebar__user-name">{user?.name || 'User'}</span>
                            <span className="dashboard-sidebar__user-role">{isDoctor ? 'Pulmonologist' : 'Patient'}</span>
                        </div>
                    </div>
                    <button className="dashboard-sidebar__logout" onClick={handleLogout} title="Logout">
                        <LogOut size={18} />
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="dashboard-main">
                {/* Mobile Header */}
                <header className="dashboard-mobile-header">
                    <button className="dashboard-mobile-header__menu" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                        {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                    </button>
                    <span className="dashboard-mobile-header__title">RespireAI</span>
                    <div className="dashboard-mobile-header__avatar" style={{
                        background: (isDoctor && !user?.photo_url)
                            ? 'linear-gradient(135deg, #10B981, #059669)'
                            : (!isDoctor && !user?.photo_url) ? 'linear-gradient(135deg, #0066CC, #0088E0)' : 'transparent'
                    }}>
                        {user?.photo_url ? (
                            <img src={api.getPhotoUrl(user.photo_url)} alt={user.name} className="dashboard-mobile-header__avatar-img" />
                        ) : initials}
                    </div>
                </header>

                {/* Mobile Slide Menu */}
                {mobileMenuOpen && (
                    <div className="dashboard-mobile-overlay" onClick={() => setMobileMenuOpen(false)}>
                        <nav className="dashboard-mobile-menu" onClick={e => e.stopPropagation()}>
                            {navItems.map(item => (
                                <NavLink key={item.to} to={item.to} end={item.end}
                                    className={({ isActive }) => `dashboard-mobile-menu__link ${isActive ? 'dashboard-mobile-menu__link--active' : ''}`}
                                    onClick={() => setMobileMenuOpen(false)}>
                                    <item.icon size={18} />
                                    <span>{item.label}</span>
                                </NavLink>
                            ))}
                            <button className="dashboard-mobile-menu__link dashboard-mobile-menu__link--danger" onClick={handleLogout}>
                                <LogOut size={18} /> <span>Logout</span>
                            </button>
                        </nav>
                    </div>
                )}

                {/* Page Content */}
                <div className="dashboard-content">
                    <Outlet />
                </div>

                {/* Mobile Bottom Nav */}
                <nav className="dashboard-bottom-nav">
                    {navItems.slice(0, 5).map(item => (
                        <NavLink key={item.to} to={item.to} end={item.end}
                            className={({ isActive }) => `dashboard-bottom-nav__item ${isActive ? 'dashboard-bottom-nav__item--active' : ''}`}>
                            <item.icon size={20} />
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>
            </main>
        </div>
    );
}
