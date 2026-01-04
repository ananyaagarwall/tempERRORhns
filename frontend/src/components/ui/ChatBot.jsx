import React, { useState, useRef, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMessageCircle, FiX, FiSend, FiUser, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import { fetchProperties, fetchBuilderByName } from '../../services/api';
import ChatbotPropertyCard from './ChatbotPropertyCard';
import ChatbotBuilderCard from './ChatbotBuilderCard';
import { ChatbotContext } from '../../App';
import './ChatBot.css';

const ChatBot = () => {
  const { isChatbotOpen, setIsChatbotOpen } = useContext(ChatbotContext);
  const isOpen = isChatbotOpen;
  const setIsOpen = setIsChatbotOpen;
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I'm here to help you with any questions you have. How can I assist you today?", sender: 'bot', timestamp: new Date(), isTypingEffect: false }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false); // This controls the input bar disable state and generic typing indicator
  const [currentPropertyIndex, setCurrentPropertyIndex] = useState(0);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handlePreviousProperty = () => {
    const currentMessage = messages[messages.length - 1];
    if (currentMessage.properties && currentMessage.properties.length > 0) {
      setCurrentPropertyIndex(prev => 
        prev === 0 ? currentMessage.properties.length - 1 : prev - 1
      );
    }
  };

  const handleNextProperty = () => {
    const currentMessage = messages[messages.length - 1];
    if (currentMessage.properties && currentMessage.properties.length > 0) {
      setCurrentPropertyIndex(prev => 
        prev === currentMessage.properties.length - 1 ? 0 : prev + 1
      );
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: inputMessage,
      sender: 'user',
      timestamp: new Date(),
      isTypingEffect: false
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true); // Disable input and show generic typing indicator
    setCurrentPropertyIndex(0); // Reset property index for new searches

    const lowerCaseMessage = inputMessage.toLowerCase();
    let botResponse = {};

    // Attempt to detect property search queries
    if (lowerCaseMessage.includes('property') || lowerCaseMessage.includes('properties') || lowerCaseMessage.includes('bhk')) {
      const locationMatch = lowerCaseMessage.match(/(in|near)\s+([a-z0-9\s]+)/);
      const bhkMatch = lowerCaseMessage.match(/([0-9])\s*bhk/);
      const priceMatch = lowerCaseMessage.match(/under\s+([0-9]+\.?[0-9]*)\s*(cr|lakh)/);

      const filters = {};
      if (locationMatch && locationMatch[2]) {
        filters.location = locationMatch[2].trim();
      }
      if (bhkMatch && bhkMatch[1]) {
        filters.bhkTypes = [`${bhkMatch[1]}BHK`];
      }
      if (priceMatch && priceMatch[1] && priceMatch[2]) {
        let priceVal = parseFloat(priceMatch[1]);
        if (priceMatch[2] === 'lakh') {
          priceVal = priceVal / 100; // Convert lakhs to crores
        }
        filters.priceRange = priceVal;
      }

      try {
        const fetchedProperties = await fetchProperties(filters);
        if (fetchedProperties && fetchedProperties.length > 0) {
          botResponse = {
            id: messages.length + 2,
            text: 'Here are some properties I found matching your criteria:',
            sender: 'bot',
            timestamp: new Date(),
            properties: fetchedProperties,
            suggestions: [
              { text: "Search more properties", action: "search_property" },
              { text: "Find builders", action: "find_builders" },
              { text: "Explore blogs", action: "explore_blogs" }
            ],
            isTypingEffect: true // Enable typing effect for this message
          };
        } else {
          botResponse = {
            id: messages.length + 2,
            text: 'I could not find any properties matching your criteria. Please try a different search.',
            sender: 'bot',
            timestamp: new Date(),
            suggestions: [
              { text: "Try different property search", action: "search_property" },
              { text: "What else can you do?", action: "help" }
            ],
            isTypingEffect: true
          };
        }
      } catch (err) {
        console.error('Error fetching properties in chatbot:', err);
        botResponse = {
          id: messages.length + 2,
          text: 'An error occurred while searching for properties. Please try again later.',
          sender: 'bot',
          timestamp: new Date(),
          suggestions: [
            { text: "Try again", action: "retry_last_search" },
            { text: "Contact support", action: "contact_support" }
          ],
          isTypingEffect: true
        };
      }
    } else if (lowerCaseMessage.includes('builder') || lowerCaseMessage.includes('builders') || lowerCaseMessage.includes('company')) {
        const builderNameMatch = lowerCaseMessage.match(/(builder|company)\s+(.+)/);
        const builderName = builderNameMatch && builderNameMatch[2] ? builderNameMatch[2].trim() : '';

        if (builderName) {
            try {
                const fetchedBuilder = await fetchBuilderByName(builderName);
                if (fetchedBuilder) {
                    botResponse = {
                        id: messages.length + 2,
                        text: `Here is the builder I found for "${builderName}":`,
                        sender: 'bot',
                        timestamp: new Date(),
                        builders: [fetchedBuilder],
                        suggestions: [
                            { text: "Search more builders", action: "find_builders" },
                            { text: "View builder projects", action: `view_builder_projects_${fetchedBuilder['rer-id']}` }
                        ],
                        isTypingEffect: true
                    };
                } else {
                    botResponse = {
                        id: messages.length + 2,
                        text: `I could not find a builder named "${builderName}". Please try a different name.`,
                        sender: 'bot',
                        timestamp: new Date(),
                        suggestions: [
                            { text: "Try different builder name", action: "find_builders" },
                            { text: "What else can you do?", action: "help" }
                        ],
                        isTypingEffect: true
                    };
                }
            } catch (err) {
                console.error('Error fetching builder in chatbot:', err);
                botResponse = {
                    id: messages.length + 2,
                    text: 'An error occurred while searching for builders. Please try again later.',
                    sender: 'bot',
                    timestamp: new Date(),
                    suggestions: [
                        { text: "Try again", action: "retry_last_search" },
                        { text: "Contact support", action: "contact_support" }
                    ],
                    isTypingEffect: true
                };
            }
        } else {
            botResponse = {
                id: messages.length + 2,
                text: 'Please specify a builder name to search for.',
                sender: 'bot',
                timestamp: new Date(),
                suggestions: [
                    { text: "How to search for builders?", action: "help_builders" },
                    { text: "Show all builders", action: "show_all_builders" }
                ],
                isTypingEffect: true
            };
        }
    }
    else {
      // Generic bot response for other queries
      const botResponses = [
        "Thank you for your question! I'll do my best to help you.",
        "That's a great question! Let me provide you with some information.",
        "I appreciate your inquiry. Here's what I can tell you:",
        "Thanks for reaching out! I'd be happy to assist you with that.",
        "Excellent question! Let me help you with that information.",
        "I'm here to assist you! What can I help you with?",
        "Got it! I'm processing your request. What information are you looking for?"
      ];
      const randomResponse = botResponses[Math.floor(Math.random() * botResponses.length)];
      botResponse = {
        id: messages.length + 2,
        text: randomResponse,
        sender: 'bot',
        timestamp: new Date(),
        suggestions: [
          { text: "Search properties", action: "search_property" },
          { text: "Find builders", action: "find_builders" },
          { text: "Explore blogs", action: "explore_blogs" },
          { text: "Contact support", action: "contact_support" }
        ],
        isTypingEffect: true
      };
    }

    // Simulate bot typing effect
    const typingDuration = botResponse.text.length * 50; // 50ms per character

    // Add a temporary message with typing indicator
    setMessages(prev => [
      ...prev,
      { id: messages.length + 2, text: '', sender: 'bot', timestamp: new Date(), isTypingEffect: true }
    ]);

    setTimeout(() => {
      setMessages(prev => {
        // Replace the typing message with the actual bot response
        const updatedMessages = prev.map(msg => 
          msg.id === (messages.length + 2) ? { ...botResponse, isTypingEffect: false } : msg
        );
        return updatedMessages;
      });
      setIsTyping(false); // Re-enable input after bot finishes typing
    }, typingDuration + 500); // Add a small delay after typing
  };

  const handleSuggestionClick = (action, payload) => {
    // Implement logic based on the action
    console.log(`Suggestion clicked: ${action}`, payload);
    let simulatedInput = '';
    switch (action) {
      case "search_property":
        simulatedInput = "show properties";
        break;
      case "find_builders":
        simulatedInput = "find builders";
        break;
      case "explore_blogs":
        navigate('/blogs'); // Navigate to blog page
        setIsOpen(false); // Close chatbot after navigation
        return;
      case "contact_support":
        simulatedInput = "I need support"; // Placeholder for actual support flow
        break;
      case "retry_last_search":
        // Logic to re-run the last search. For now, just a message.
        simulatedInput = "Can you try searching again?";
        break;
      case "view_builder_projects":
        // Example payload: `view_builder_projects_RERA123`
        const reraId = payload.split('_').pop();
        navigate(`/builder/${reraId}/projects`);
        setIsOpen(false);
        return;
      case "help":
        simulatedInput = "What can you do?";
        break;
      case "help_builders":
        simulatedInput = "How do I search for a builder?";
        break;
      case "show_all_builders":
        simulatedInput = "show all builders";
        break;
      default:
        simulatedInput = `Tell me more about ${action}`; // Generic fallback
    }
    // Simulate sending a message from the user
    setInputMessage(simulatedInput);
    handleSendMessage({ preventDefault: () => {} }); // Call with a mock event object
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Chatbot Trigger Button */}
      <div className="chatbot-trigger-container">
        <button 
          className={`chatbot-trigger ${isOpen ? 'hidden' : ''}`}
          onClick={() => setIsOpen(true)}
          aria-label="Open chat"
        >
          <FiMessageCircle className="chatbot-icon" />
          <span className="chatbot-pulse"></span>
        </button>
      </div>

      {/* Chat Interface */}
      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-header-content">
            <div className="chatbot-avatar">
              <FiUser className="chatbot-avatar-icon" />
            </div>
            <div className="chatbot-header-info">
              <h3 className="chatbot-title">Assistant</h3>
              <p className="chatbot-status">Online</p>
            </div>
          </div>
          <button 
            className="chatbot-close"
            onClick={() => setIsOpen(false)}
            aria-label="Close chat"
          >
            <FiX className="chatbot-close-icon" />
          </button>
        </div>

        <div className="chatbot-messages">
          {messages.map((message) => (
            <div 
              key={message.id} 
              className={`chatbot-message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
            >
              <div className={`chatbot-message-content ${message.properties || message.builders ? 'chatbot-message-full-width' : ''}`}>
                {message.sender === 'bot' && message.isTypingEffect ? (
                  <div className="chatbot-typing-effect-text"><TypingEffect text={message.text} /></div>
                ) : (
                <p className="chatbot-message-text">{message.text}</p>
                )}
                
                {message.properties && message.properties.length > 0 && (
                  <div className="chatbot-property-cards-horizontal">
                    {message.properties.map(prop => (
                      <div key={prop.id} className="chatbot-property-card-item">
                        <ChatbotPropertyCard property={prop} />
                      </div>
                    ))}
                  </div>
                )}
                {message.builders && message.builders.length > 0 && (
                  <div className="chatbot-properties-carousel">
                    {message.builders.map(builder => (
                      <ChatbotBuilderCard key={builder.rer-id || builder.company_name} builder={builder} />
                    ))}
                  </div>
                )}
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="chatbot-suggestions">
                    {message.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        className="chatbot-suggestion-chip"
                        onClick={() => handleSuggestionClick(suggestion.action, suggestion.payload)}
                      >
                        {suggestion.text}
                      </button>
                    ))}
                  </div>
                )}
                <span className="chatbot-message-time">{formatTime(message.timestamp)}</span>
              </div>
            </div>
          ))}
          
          {/* Removed generic typing indicator as it's replaced by per-message typing effect */}
          {/* {isTyping && (
            <div className="chatbot-message bot-message">
              <div className="chatbot-message-content">
                <div className="chatbot-typing">
                  <span className="chatbot-typing-dot"></span>
                  <span className="chatbot-typing-dot"></span>
                  <span className="chatbot-typing-dot"></span>
                </div>
              </div>
            </div>
          )} */}
          
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="chatbot-input-container">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Type your message..."
            className="chatbot-input"
            disabled={isTyping}
          />
          <button 
            type="submit"
            className="chatbot-send"
            disabled={!inputMessage.trim() || isTyping}
            aria-label="Send message"
          >
            <FiSend className="chatbot-send-icon" />
          </button>
        </form>
      </div>
    </>
  );
};

// New TypingEffect component
const TypingEffect = ({ text }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayedText(prevText => prevText + text[currentIndex]);
        setCurrentIndex(prevIndex => prevIndex + 1);
      }, 30); // Adjust typing speed here
      return () => clearTimeout(timeout);
    }
  }, [text, currentIndex]);

  return <span className="chatbot-message-text">{displayedText}</span>;
};

export default ChatBot;