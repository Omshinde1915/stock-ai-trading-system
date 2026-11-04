import React, { useState, useRef, useEffect } from 'react';
import { sendChatMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Chatbot.css';

function Chatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! I\'m your AI Stock Assistant. Ask me about stocks, predictions, or analysis!\n\nTry:\n• "What is TCS prediction?"\n• "Reliance cha analysis kar"\n• "TCS ka risk kya hai?"' }
    ]);
    const [input, setInput] = useState('');
    const [sessionId, setSessionId] = useState(null);
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { isAuthenticated } = useAuth();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await sendChatMessage(userMessage, sessionId);
            setSessionId(response.data.session_id);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: response.data.response 
            }]);
        } catch (error) {
            console.error('Chatbot error:', error);
            setMessages(prev => [...prev, { 
                role: 'assistant', 
                content: 'Sorry, I encountered an error. Please try again.' 
            }]);
        } finally {
            setLoading(false);
        }
    };

    if (!isAuthenticated) return null;

    return (
        <>
            <button 
                className="chatbot-toggle"
                onClick={() => setIsOpen(!isOpen)}
                title="AI Stock Assistant"
            >
                {isOpen ? '✕' : '💬'}
            </button>

            {isOpen && (
                <div className="chatbot-window">
                    <div className="chatbot-header">
                        <div>
                            <h4>🤖 AI Stock Assistant</h4>
                            <span className="status">Online</span>
                        </div>
                        <button className="close-btn" onClick={() => setIsOpen(false)}>×</button>
                    </div>
                    
                    <div className="chatbot-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.role}`}>
                                {msg.content}
                            </div>
                        ))}
                        {loading && (
                            <div className="message assistant loading-dots">
                                <span>.</span><span>.</span><span>.</span>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <form className="chatbot-input" onSubmit={handleSend}>
                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask about stocks..."
                            disabled={loading}
                        />
                        <button type="submit" disabled={loading || !input.trim()}>
                            Send
                        </button>
                    </form>
                </div>
            )}
        </>
    );
}

export default Chatbot;