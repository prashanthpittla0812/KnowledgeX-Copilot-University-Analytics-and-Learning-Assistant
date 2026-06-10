import React from 'react';
import { Bot } from 'lucide-react'; // Ensure lucide-react is installed
import { useNavigate, useLocation } from 'react-router-dom';

const CopilotFloatingButton = ({ onClick }) => {
    const navigate = useNavigate();
    const location = useLocation();

    // Show only on the student dashboard
    if (location.pathname !== '/student-dashboard') {
        return null;
    }

    return (
        <button
            onClick={onClick || (() => navigate('/chatbot'))}
            aria-label="Open KnowledgeX Copilot"
            style={{
                position: 'fixed',
                bottom: '30px',
                right: '30px',
                backgroundColor: '#FFFFFF',
                borderRadius: '50%',
                width: '64px',
                height: '64px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #FF7F00',
                boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.2)',
                cursor: 'pointer',
                zIndex: 1000,
                transition: 'transform 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
            <img src="/kx-robot.png" alt="KnowledgeX Copilot" style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'contain' }} />
        </button>
    );
};

export default CopilotFloatingButton;