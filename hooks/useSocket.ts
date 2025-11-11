/**
 * useSocket Hook
 * Manages socket connection lifecycle and authentication
 */

import { useAuth } from '@/context/AuthContext';
import {
    disconnectSocket,
    getSocket,
    initializeSocket,
    isSocketReady
} from '@/services/socket';
import { useEffect, useRef, useState } from 'react';
import { Socket } from 'socket.io-client';
import { AppState, AppStateStatus } from 'react-native';

interface UseSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

/**
 * Hook to manage socket connection
 * Returns the socket instance and connection status
 * Socket is initialized by AuthContext when user authenticates
 */
export function useSocket(): UseSocketReturn {
  const { user, isAuthenticated: userIsAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const appState = useRef(AppState.currentState);

  // Get socket instance and set up listeners
  useEffect(() => {
    if (!userIsAuthenticated || !user?.id) {
      console.log('⚠️ User not authenticated, no socket available');
      setSocket(null);
      setIsConnected(false);
      setIsAuthenticated(false);
      return;
    }

    // Get the socket instance (initialized by AuthContext)
    const socketInstance = getSocket();
    
    if (!socketInstance) {
      console.log('⚠️ Socket not initialized yet');
      return;
    }

    console.log('🔌 useSocket: Setting up socket listeners');
    setSocket(socketInstance);
    setIsConnected(socketInstance.connected);
    setIsAuthenticated(socketInstance.connected);

    // Listen for connection events
    const handleConnect = () => {
      console.log('✅ useSocket: Socket connected');
      setIsConnected(true);
      setIsAuthenticated(true);
      setError(null);
    };

    const handleConnectError = (err: Error) => {
      console.error('❌ useSocket: Connection error:', err.message);
      setIsConnected(false);
      setError(err.message);
    };

    const handleDisconnect = (reason: string) => {
      console.log('🔌 useSocket: Socket disconnected:', reason);
      setIsConnected(false);
      setIsAuthenticated(false);
    };

    const handleReconnect = () => {
      console.log('✅ useSocket: Socket reconnected');
      setIsConnected(true);
      setIsAuthenticated(true);
      setError(null);
    };

    const handlePendingMessages = (data: { count: number }) => {
      console.log(`📬 ${data.count} pending messages were delivered`);
    };

    socketInstance.on('connect', handleConnect);
    socketInstance.on('connect_error', handleConnectError);
    socketInstance.on('disconnect', handleDisconnect);
    socketInstance.on('reconnect', handleReconnect);
    socketInstance.on('pending_messages_delivered', handlePendingMessages);

    // Cleanup listeners on unmount
    return () => {
      console.log('🧹 useSocket: Cleaning up socket listeners');
      socketInstance.off('connect', handleConnect);
      socketInstance.off('connect_error', handleConnectError);
      socketInstance.off('disconnect', handleDisconnect);
      socketInstance.off('reconnect', handleReconnect);
      socketInstance.off('pending_messages_delivered', handlePendingMessages);
    };
  }, [user?.id, userIsAuthenticated]);

  // Handle app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      console.log(`📱 App state changed: ${appState.current} → ${nextAppState}`);
      
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App has come to the foreground - reconnect if needed
        console.log('📱 App came to foreground - checking socket connection');
        if (!isConnected && userIsAuthenticated && user?.id) {
          console.log('🔄 Reconnecting socket...');
          const socketInstance = initializeSocket(user.id);
          setSocket(socketInstance);
        }
      } else if (nextAppState.match(/inactive|background/)) {
        // App has gone to the background - disconnect socket
        console.log('📱 App went to background - disconnecting socket');
        disconnectSocket();
        setIsConnected(false);
        setIsAuthenticated(false);
      }

      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [isConnected, userIsAuthenticated, user?.id]);

  return {
    socket,
    isConnected,
    isAuthenticated,
    error,
  };
}

/**
 * Hook to check if socket is ready (connected + authenticated)
 */
export function useSocketReady(): boolean {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const checkInterval = setInterval(() => {
      setIsReady(isSocketReady());
    }, 500);

    return () => clearInterval(checkInterval);
  }, []);

  return isReady;
}
