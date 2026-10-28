import * as types from './actionTypes.js';

export const addNotification = (notification) => ({
  type: types.ADD_NOTIFICATION,
  payload: {
    id: Date.now() + Math.random(),
    timestamp: new Date().toLocaleTimeString(),
    ...notification
  }
});

export const clearNotifications = () => ({
  type: types.CLEAR_NOTIFICATIONS
});

export const setOnlineUsers = (count) => ({
  type: types.SET_ONLINE_USERS,
  payload: count
});

export const setConnectionStatus = (isConnected) => ({
  type: types.SET_CONNECTION_STATUS,
  payload: isConnected
});

export const addToCart = (product) => ({
  type: types.ADD_TO_CART,
  payload: product
});

export const removeFromCart = (productId) => ({
  type: types.REMOVE_FROM_CART,
  payload: productId
});

export const clearCart = () => ({
  type: types.CLEAR_CART
});
