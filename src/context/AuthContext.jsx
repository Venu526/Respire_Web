import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        // Check for existing session
        const savedUser = api.getUserData();
        if (savedUser && api.getToken()) {
            setUser(savedUser);
        }
        setIsLoading(false);
    }, []);

    const login = async (email, password, role) => {
        const userData = await api.login(email, password, role);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, role) => {
        const result = await api.register(name, email, password, role);
        return result;
    };

    const logout = () => {
        api.logout();
        setUser(null);
    };

    const updateUser = (updatedData) => {
        const newUser = { ...user, ...updatedData };
        setUser(newUser);
        api.saveUserData(newUser);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAuthenticated: !!user,
                login,
                register,
                logout,
                updateUser,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
