import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaBuilding, FaNewspaper, FaShoppingCart } from 'react-icons/fa';
import { FiMessageCircle } from 'react-icons/fi';
import { ChatbotContext } from '../../App';
import './MobileFooter.css';

const MobileFooter = () => {
    const location = useLocation();
    const currentPath = location.pathname;
    const { isChatbotOpen, setIsChatbotOpen } = useContext(ChatbotContext);

    const navItems = [
        { label: 'Home', icon: FaHome, path: '/' },
        { label: 'Properties', icon: FaBuilding, path: '/properties' },
        { label: 'Cart', icon: FaShoppingCart, path: '/cart' },
        { label: 'Blogs', icon: FaNewspaper, path: '/blogs' },
    ];

    const handleChatbotToggle = () => {
        setIsChatbotOpen(!isChatbotOpen);
    };

    return (
        <nav className="mobile-footer" aria-label="Mobile navigation">
            {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path ||
                    (item.path !== '/' && currentPath.startsWith(item.path));

                return (
                    <Link
                        key={item.label}
                        to={item.path}
                        className={`mobile-footer-item ${isActive ? 'active' : ''}`}
                    >
                        <Icon className="mobile-footer-icon" />
                        <span className="mobile-footer-label">{item.label}</span>
                    </Link>
                );
            })}
            <button
                onClick={handleChatbotToggle}
                className={`mobile-footer-item chatbot-button ${isChatbotOpen ? 'active' : ''}`}
                aria-label="Toggle chat"
            >
                <FiMessageCircle className="mobile-footer-icon" />
                <span className="mobile-footer-label">Chat</span>
            </button>
        </nav>
    );
};

export default MobileFooter;
