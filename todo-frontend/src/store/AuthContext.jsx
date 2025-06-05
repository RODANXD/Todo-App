import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContextValue = createContext();

export const AuthContextP = ({ children }) => {
    const [auth, setauth] = useState({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
    });
    const [loading, setLoading] = useState(true); // Add loading state

    useEffect(() => {
        const accessToken = localStorage.getItem('access_token');
        const refresh = localStorage.getItem('refresh_token');
        if (accessToken) {
            setauth({ isAuthenticated: true, accessToken, refreshToken: refresh });
        }
        setLoading(false); // Set loading to false after checking tokens
    }, []);

    const login = (accessToken, refreshToken) => {
        localStorage.setItem('access_token', accessToken);
        localStorage.setItem('refresh_token', refreshToken);
        setauth({ isAuthenticated: true, accessToken, refreshToken });
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setauth({ isAuthenticated: false, accessToken: null, refreshToken: null });
    };

    return (
        <AuthContextValue.Provider value={{ ...auth, login, logout, loading }}>
            {children}
        </AuthContextValue.Provider>
    );
};

export const useauth = () => useContext(AuthContextValue);