import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from "jwt-decode";
import { getProfile } from '../api/AxiosAuth';
import { useNavigate } from 'react-router-dom';
const AuthContextValue = createContext();

export const AuthContextP = ({ children }) => {
    const [auth, setauth] = useState({
        isAuthenticated: false,
        accessToken: null,
        refreshToken: null,
        user: null
    });
    
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const initializeAuth = async () => {
            const accessToken = localStorage.getItem('access_token');
            const refresh = localStorage.getItem('refresh_token');
            
            if (accessToken) {
                try {
                    // First decode the token for basic auth
                    const decodetoken = jwtDecode(accessToken);
                    
                    // Then fetch the complete profile
                    const profileResponse = await getProfile();
                    const profileData = profileResponse.data;

                    setauth({
                        isAuthenticated: true,
                        accessToken,
                        refreshToken: refresh,
                        user: {
                            username: profileData.username,
                            email: profileData.email,
                            id: decodetoken.user_id,
                            // Add any other profile data you need
                        }
                    });

                    console.log("Profile data loaded:", profileData);
                } catch (error) {
                    console.error("Auth initialization failed:", error);
                    logout();
                }
            }
            setLoading(false);
        };

        initializeAuth();
    }, []);

    

    const login = async (accessToken, refreshToken) => {
        try {
            const decodedToken = jwtDecode(accessToken);
            localStorage.setItem('access_token', accessToken);
            localStorage.setItem('refresh_token', refreshToken);
                       // Fetch profile data after successful login
            const profileResponse = await getProfile();
            const profileData = profileResponse.data;

            setauth({
                isAuthenticated: true,
                accessToken,
                refreshToken,
                user: {
                    username: profileData.username,
                    email: profileData.email,
                    id: decodedToken.user_id,
                    // Add any other profile data you need
                }
            });
        } catch (error) {
            console.error('Error during login:', error);
            throw error;
        }
    };

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setauth({
            isAuthenticated: false,
            accessToken: null,
            refreshToken: null,
            user: null
        });
    };

    return (
        <AuthContextValue.Provider value={{ ...auth, login, logout, loading }}>
            {children}
        </AuthContextValue.Provider>
    );
};

export const useauth = () => useContext(AuthContextValue);