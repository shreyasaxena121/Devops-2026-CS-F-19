import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import {
  setConnectionStatus,
  setOnlineUsers,
  addNotification
} from '../store/actions.js';

export const useSocket = () => {
  const dispatch = useDispatch();
  const socketRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  useEffect(() => {
    const connect = () => {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // In local dev, API is on port 5000; in Docker/Nginx/prod, it proxies through current host
        const port = window.location.port === '5173' ? '5000' : window.location.port;
        const host = window.location.hostname;
        const wsUrl = `${protocol}//${host}${port ? `:${port}` : ''}/ws`;

        const ws = new WebSocket(wsUrl);
        socketRef.current = ws;

        ws.onopen = () => {
          dispatch(setConnectionStatus(true));
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'CONNECTED') {
              dispatch(setOnlineUsers(data.activeClients || 1));
            } else if (data.event === 'NEW_PRODUCT') {
              dispatch(
                addNotification({
                  title: 'New Campus Listing!',
                  message: `${data.product?.title || 'An item'} was just listed in ${data.product?.category || 'Marketplace'}.`
                })
              );
            } else if (data.event === 'NEW_ORDER') {
              dispatch(
                addNotification({
                  title: 'Order Activity',
                  message: `New purchase request placed for ₹${data.amount || 0}.`
                })
              );
            }
          } catch {
            // Ignore non-json messages
          }
        };

        ws.onclose = () => {
          dispatch(setConnectionStatus(false));
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        console.warn('WebSocket connection not initialized:', err);
      }
    };

    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [dispatch]);
};
