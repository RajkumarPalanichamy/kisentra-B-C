'use client';

import React, { useEffect, useState } from 'react';

interface MailFloatingButtonProps {
  email?: string;
  subject?: string;
  body?: string;
}

const MailFloatingButton: React.FC<MailFloatingButtonProps> = ({
  email = 'sales@kisentraglobal.com', // Default email from footer
  subject = 'Inquiry',
  body = 'Hello, I would like to know more about your services.',
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 767);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleClick = () => {
    const encodedSubject = encodeURIComponent(subject);
    const encodedBody = encodeURIComponent(body);
    const mailtoUrl = `mailto:${email}?subject=${encodedSubject}&body=${encodedBody}`;
    window.location.href = mailtoUrl;
  };

  const buttonSize = isMobile ? 30 : 40;
  // Mobile: 74px (scroll button bottom) + 30px (scroll button height) + 10px spacing = 114px
  // Desktop: 25px (scroll button bottom) + 40px (scroll button height) + 10px spacing = 75px
  const bottomPosition = isMobile ? 114 : 75;

  return (
    <div
      className="mail-float"
      onClick={handleClick}
      style={{
        position: 'fixed',
        bottom: `${bottomPosition}px`, // Positioned above scroll button
        right: '30px', // Aligned with scroll button
        width: `${buttonSize}px`,
        height: `${buttonSize}px`,
        backgroundColor: '#0f55dc',
        borderRadius: '5px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(15, 85, 220, 0.4)',
        zIndex: 9999,
        transition: 'all 0.3s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-4px)';
        e.currentTarget.style.boxShadow = '0 6px 16px rgba(15, 85, 220, 0.6)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = '0 4px 12px rgba(15, 85, 220, 0.4)';
      }}
    >
      <svg
        width={isMobile ? '16' : '20'}
        height={isMobile ? '16' : '20'}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"
          fill="white"
        />
      </svg>
    </div>
  );
};

export default MailFloatingButton;
