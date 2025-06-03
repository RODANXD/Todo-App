import React, { useEffect, useState } from 'react';

export const useAuth = () => {
    const [isAuthExpired, setIsAuthExpired] = useState(false);

    useEffect(() => {
        const expiry = localStorage.getItem('expiry');
        const authexpired = Date.now() > (parseFloat(expiry) * 1000);
        console.log(Date.now(), expiry);
        setIsAuthExpired(authexpired);

        if (!expiry) {
            setIsAuthExpired(true);
        }
    }, []);

    return isAuthExpired;
};