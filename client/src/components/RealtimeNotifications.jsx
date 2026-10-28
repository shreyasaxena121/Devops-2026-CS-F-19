import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Toast, ToastContainer } from 'react-bootstrap';
import { useSocket } from '../utils/useSocket';
import { clearNotifications } from '../store/actions';

const RealtimeNotifications = () => {
  // Initialize WebSocket connection
  useSocket();

  const dispatch = useDispatch();
  const notifications = useSelector((state) => state.realtime.notifications);
  const isConnected = useSelector((state) => state.realtime.isConnected);

  if (!notifications || notifications.length === 0) {
    return null;
  }

  const latest = notifications[0];

  return (
    <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 9999 }}>
      <Toast onClose={() => dispatch(clearNotifications())} delay={6000} autohide bg="dark">
        <Toast.Header>
          <span
            className={`me-2 rounded-circle d-inline-block ${
              isConnected ? 'bg-success' : 'bg-warning'
            }`}
            style={{ width: '10px', height: '10px' }}
          ></span>
          <strong className="me-auto text-primary">CampusCart Live</strong>
          <small className="text-muted">{latest.timestamp}</small>
        </Toast.Header>
        <Toast.Body className="text-white">
          <div className="fw-semibold">{latest.title}</div>
          <div className="small text-light">{latest.message}</div>
        </Toast.Body>
      </Toast>
    </ToastContainer>
  );
};

export default RealtimeNotifications;
