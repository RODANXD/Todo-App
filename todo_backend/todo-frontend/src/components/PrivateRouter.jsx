import React from 'react';
import { Navigate } from 'react-router-dom';
import { useauth } from '../store/AuthContext';

const PrivateRouter = ({ children }) => {
    const { isAuthenticated, loading } = useauth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRouter;