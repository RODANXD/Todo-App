import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";


export const useWebSocket = (url) => {
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const reconnectAttempts = useRef(0);
    const maxReconnectAttempts = 5;
    const wsRef = useRef(null);
    const reconnectTimeoutRef = useRef(null);

    const connect = useCallback(() => {
        // Clear any existing reconnect timeout
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
            reconnectTimeoutRef.current = null;
        }

        const token = localStorage.getItem('access_token');
        if (!token) {
            toast.error("No authentication token found. Please log in.");
            console.error("No authentication token found");
            return;
        }

        const wsUrl = `${import.meta.env.VITE_BACKENDURL}${url}?token=${token}`;
        console.log('Connecting to:', wsUrl);

        // Close existing connection if any
        if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
            wsRef.current.close();
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
            console.log('WebSocket Connected');
            setIsConnected(true);
            reconnectAttempts.current = 0;
            setSocket(ws);
        };

        ws.onclose = (event) => {
            console.log('WebSocket Disconnected', event.code, event.reason);
            setIsConnected(false);
            setSocket(null);
            
            // Only attempt reconnection if it wasn't a clean close and we haven't exceeded max attempts
            if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
                const timeout = Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000);
                reconnectTimeoutRef.current = setTimeout(() => {
                    reconnectAttempts.current += 1;
                    connect();
                }, timeout);
            }
        };

        ws.onerror = (error) => {
            toast.error("WebSocket error occurred. Attempting to reconnect...");
            console.error('WebSocket Error:', error);
        };

        return ws;
    }, [url]);

    useEffect(() => {
        if (url) {
            connect();
        }

        return () => {
            // Clean up timeouts
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
                reconnectTimeoutRef.current = null;
            }
            
            // Clean close the WebSocket
            if (wsRef.current && wsRef.current.readyState !== WebSocket.CLOSED) {
                wsRef.current.close(1000, "Component unmounting");
            }
            wsRef.current = null;
        };
    }, [url]); // Only depend on url, not connect

    return {
        socket: wsRef.current,
        isConnected,
        reconnect: connect
    };
};