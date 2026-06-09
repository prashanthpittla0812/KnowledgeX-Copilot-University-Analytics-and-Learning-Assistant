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
                backgroundColor: '#FF7F00', // Matches your dashboard branding
                color: '#FFFFFF',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                boxShadow: '0px 6px 15px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer',
                zIndex: 1000,
                transition: 'transform 0.2s ease-in-out'
            }}
            onMouseEnter={(e) => e.target.style.transform = 'scale(1.1)'}
            onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
        >
            <Bot size={30} />
        </button>
    );
};

export default CopilotFloatingButton;