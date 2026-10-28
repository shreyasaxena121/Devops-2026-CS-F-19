import { combineReducers } from 'redux';
import * as types from './actionTypes.js';

// Real-Time & Live Notifications State
const initialRealtimeState = {
  isConnected: false,
  onlineUsers: 0,
  notifications: []
};

const realtimeReducer = (state = initialRealtimeState, action) => {
  switch (action.type) {
    case types.SET_CONNECTION_STATUS:
      return { ...state, isConnected: action.payload };
    case types.SET_ONLINE_USERS:
      return { ...state, onlineUsers: action.payload };
    case types.ADD_NOTIFICATION:
      return {
        ...state,
        notifications: [action.payload, ...state.notifications].slice(0, 10)
      };
    case types.CLEAR_NOTIFICATIONS:
      return { ...state, notifications: [] };
    default:
      return state;
  }
};

// Cart / Trade State
const initialCartState = {
  items: []
};

const cartReducer = (state = initialCartState, action) => {
  switch (action.type) {
    case types.ADD_TO_CART:
      if (state.items.some((item) => item._id === action.payload._id)) {
        return state;
      }
      return { ...state, items: [...state.items, action.payload] };
    case types.REMOVE_FROM_CART:
      return {
        ...state,
        items: state.items.filter((item) => item._id !== action.payload)
      };
    case types.CLEAR_CART:
      return { ...state, items: [] };
    default:
      return state;
  }
};

export const rootReducer = combineReducers({
  realtime: realtimeReducer,
  cart: cartReducer
});
