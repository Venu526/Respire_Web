export const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
};

export const validatePassword = (password) => {
    // Min 6 chars, at least one letter and one number
    const re = /^(?=.*[A-Za-z])(?=.*\d).{6,}$/;
    return re.test(password);
};

export const validateName = (name) => {
    const trimmed = name.trim();
    return trimmed.length >= 2 && trimmed.length <= 50;
};

export const validatePhone = (phone) => {
    if (!phone) return true; // Optional
    const trimmed = phone.trim().replace(/[^\d]/g, '');
    return trimmed.length === 10;
};

export const validateHeight = (height) => {
    if (!height) return true;
    const num = Number(height);
    return num >= 50 && num <= 250;
};

export const validateWeight = (weight) => {
    if (!weight) return true;
    const num = Number(weight);
    return num >= 20 && num <= 300;
};

export const validateDOB = (dob) => {
    if (!dob) return true;
    const date = new Date(dob);
    if (isNaN(date.getTime())) return false;
    return date <= new Date(); // Not in future
};

export const VITAL_LIMITS = {
    spo2: { min: 50, max: 100, label: 'SpO₂', unit: '%' },
    rr: { min: 10, max: 60, label: 'Respiratory Rate', unit: '/min' },
    hr: { min: 30, max: 250, label: 'Heart Rate', unit: 'bpm' },
    temp: { min: 32, max: 43, label: 'Temperature', unit: '°C' },
    systolic_bp: { min: 40, max: 250, label: 'Systolic BP', unit: 'mmHg' },
    diastolic_bp: { min: 20, max: 200, label: 'Diastolic BP', unit: 'mmHg' },
    oxygen_flow: { min: 0, max: 60, label: 'Oxygen Flow', unit: 'L/min' },
    fio2: { min: 21, max: 100, label: 'FiO₂', unit: '%' }
};

export const validateVital = (param, value) => {
    if (!value) return null;
    const num = Number(value);
    const limit = VITAL_LIMITS[param];
    if (!limit) return null;

    if (num < limit.min) return `${limit.label} too low (min: ${limit.min}${limit.unit})`;
    if (num > limit.max) return `${limit.label} too high (max: ${limit.max}${limit.unit})`;
    return null;
};
