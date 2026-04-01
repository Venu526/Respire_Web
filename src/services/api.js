// ====================================================
// RespireWeb — API Service
// Mirrors NetworkAPI.swift from iOS app
// ====================================================

const getApiBase = () => {
    if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    
    // Use the proxy (/api) if running in dev mode
    if (import.meta.env.DEV) {
        return '/api';
    }
    
    // Otherwise, use the full production URL
    return 'http://180.235.121.245/2026JanMarch/respireai/api';
};

const API_BASE = getApiBase();
console.log('[API] Initialized with BASE:', API_BASE);

class APIService {
    constructor() {
        this.tokenKey = 'respire_auth_token';
        this.userKey = 'respire_user_data';
    }

    // ── Token Management ──
    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    saveToken(token) {
        localStorage.setItem(this.tokenKey, token);
    }

    clearToken() {
        localStorage.removeItem(this.tokenKey);
    }

    // ── User Data ── 
    getUserData() {
        const data = localStorage.getItem(this.userKey);
        return data ? JSON.parse(data) : null;
    }

    saveUserData(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearUserData() {
        localStorage.removeItem(this.userKey);
    }

    // ── Photo URL Resolution ──
    getPhotoUrl(photo_url) {
        if (!photo_url) return null;
        if (photo_url.startsWith('http')) return photo_url;
        // Resolve relative to API root (parent of /api)
        const apiRoot = API_BASE.replace(/\/api$/, '');
        return `${apiRoot}/${photo_url.replace(/^\//, '')}`;
    }

    // ── Authenticated Request ──
    async request(url, options = {}) {
        const token = this.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        };

        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }

        const fullUrl = `${API_BASE}${url}`;
        try {
            const response = await fetch(fullUrl, {
                ...options,
                headers,
                cache: 'no-store' // The correct way to prevent caching without triggering CORS header issues
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`[API] Error ${response.status} from ${fullUrl}:`, data);
                throw new Error(data.error || `Request failed with status ${response.status}`);
            }

            return data;
        } catch (err) {
            console.error(`[API] Fetch failed for ${fullUrl}:`, err);
            throw err;
        }
    }

    // ── Authentication ──
    async login(email, password, role) {
        const data = await this.request('/users.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'login', email, password, role }),
        });

        if (data.success && data.user) {
            if (data.token) {
                this.saveToken(data.token);
            }
            this.saveUserData(data.user);
            // Record session start time for cross-platform vitals detection
            // Set to 1 hour ago to catch recent vitals from other platforms (iOS sync)
            const hourAgo = new Date(Date.now() - 3600000).toISOString();
            sessionStorage.setItem('session_login_time', hourAgo);
            return data.user;
        }

        throw new Error(data.error || 'Login failed');
    }

    async register(name, email, password, role = 'patient') {
        const data = await this.request('/users.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'register', name, email, password, role }),
        });

        if (data.success || data.id) {
            if (data.token) {
                this.saveToken(data.token);
            }
            return data;
        }

        throw new Error(data.error || 'Registration failed');
    }

    async forgotPassword(email) {
        const data = await this.request('/forgot_password.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'send_otp', email }),
        });
        return data;
    }

    async verifyOTP(email, otp) {
        const data = await this.request('/forgot_password.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'verify_otp', email, otp }),
        });
        return data;
    }

    async resetPassword(email, otp, newPassword) {
        const data = await this.request('/forgot_password.php', {
            method: 'POST',
            body: JSON.stringify({ action: 'reset_password', email, otp, new_password: newPassword }),
        });
        return data;
    }

    async changePassword(userId, currentPassword, newPassword) {
        const data = await this.request('/users.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'change_password',
                user_id: userId,
                current_password: currentPassword,
                new_password: newPassword,
            }),
        });
        return data;
    }

    async updateProfile(userId, profileData) {
        return await this.request('/users.php', {
            method: 'POST',
            body: JSON.stringify({
                action: 'update_profile',
                user_id: userId,
                ...profileData
            }),
        });
    }

    // ── Patient Data ──
    async fetchPatient(id) {
        const data = await this.request(`/patients.php?id=${id}`);
        return data;
    }

    async fetchVitals(userId, days = null) {
        let url = `/vitals.php?user_id=${userId}`;
        if (days) url += `&days=${days}`;
        const data = await this.request(url);
        return data;
    }

    async addVitals(vitalsData) {
        const data = await this.request('/vitals.php', {
            method: 'POST',
            body: JSON.stringify(vitalsData),
        });
        return data;
    }

    async shareVitals(patientId, doctorId) {
        return await this.request('/share_vitals.php', {
            method: 'POST',
            body: JSON.stringify({ patient_id: patientId, doctor_id: doctorId }),
        });
    }

    // ── Alerts ──
    async fetchAlerts(patientId, limit = 50) {
        let url = `/alerts.php?limit=${limit}`;
        if (patientId) url += `&patient_id=${patientId}`;
        return await this.request(url);
    }

    async fetchDoctorAlerts() {
        return await this.request('/alerts.php?limit=50');
    }

    async acknowledgeAlert(alertId, acknowledgedBy = 'Doctor') {
        return await this.request('/alerts.php', {
            method: 'POST',
            body: JSON.stringify({
                acknowledge: true,
                alert_id: alertId,
                acknowledged_by: acknowledgedBy
            })
        });
    }

    // ── Doctor APIs ──
    async fetchDoctors() {
        return await this.request('/users.php?role=doctor');
    }

    async fetchPatientsList(doctorId) {
        return await this.request(`/patients.php?doctor_id=${doctorId}`);
    }

    async fetchDoctorDashboard(doctorId) {
        return await this.request(`/doctor_dashboard.php?doctor_id=${doctorId}`);
    }

    async fetchAppointments(userId, role = 'patient') {
        const param = role === 'doctor' ? 'doctor_id' : 'patient_id';
        return await this.request(`/appointments.php?${param}=${userId}`);
    }

    // New helper for doctor specific calls
    async fetchDoctorAppointments(doctorId) {
        return await this.fetchAppointments(doctorId, 'doctor');
    }

    async fetchDoctorPatients(doctorId) {
        return await this.fetchPatientsList(doctorId);
    }

    async updateAppointmentStatus(id, status) {
        return await this.request('/appointments.php', {
            method: 'PUT',
            body: JSON.stringify({ id, status })
        });
    }

    // ── Profile Photo ──
    async uploadPhoto(userId, file) {
        const formData = new FormData();
        formData.append('user_id', userId);
        formData.append('photo', file);

        const token = this.getToken();
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        // Do NOT set Content-Type — browser sets it with multipart boundary
        const response = await fetch(`${API_BASE}/upload_photo.php`, {
            method: 'POST',
            headers,
            body: formData,
        });

        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.error || 'Photo upload failed');
        }
        return data;
    }

    // ── Logout ──
    logout() {
        this.clearToken();
        this.clearUserData();
        sessionStorage.removeItem('has_session_vitals');
        sessionStorage.removeItem('session_login_time');
    }
}

const api = new APIService();
export default api;
