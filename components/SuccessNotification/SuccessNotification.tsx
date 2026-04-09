'use client';

import React, { useEffect, useState } from 'react';
import { Fade } from 'react-awesome-reveal';

interface SuccessNotificationProps {
  message: string;
  onClose?: () => void;
  duration?: number;
}

const SuccessNotification: React.FC<SuccessNotificationProps> = ({
  message,
  onClose,
  duration = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!isVisible) return null;

  return (
    <Fade direction="down" duration={300}>
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 10000,
          backgroundColor: '#10b981',
          color: 'white',
          padding: '20px 30px',
          borderRadius: '12px',
          boxShadow: '0 10px 25px rgba(0, 0, 0, 0.2)',
          display: 'flex',
          alignItems: 'center',
          gap: '15px',
          minWidth: '300px',
          maxWidth: '500px',
          animation: 'slideInRight 0.3s ease-out',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <i className="fas fa-check" style={{ fontSize: '20px' }}></i>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ margin: 0, fontWeight: 600, fontSize: '16px' }}>
            {message}
          </p>
        </div>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(() => onClose?.(), 300);
          }}
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            cursor: 'pointer',
            padding: '5px',
            fontSize: '18px',
            opacity: 0.8,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.8')}
        >
          <i className="fas fa-times"></i>
        </button>
        <style jsx>{`
          @keyframes slideInRight {
            from {
              transform: translateX(100%);
              opacity: 0;
            }
            to {
              transform: translateX(0);
              opacity: 1;
            }
          }
        `}</style>
      </div>
    </Fade>
  );
};

export default SuccessNotification;
