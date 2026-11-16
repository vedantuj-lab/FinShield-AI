import { useState, useEffect } from 'react';
import ChatInterface from './ChatInterface';
import ConversationHistory from './ConversationHistory';
import './AIAssistant.css';

interface Conversation {
  id: string;
  title: string;
  language: string;
  created_at: string;
  updated_at: string;
}

export default function AIAssistant() {
  const authToken = localStorage.getItem('authToken') || '';
  
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [language, setLanguage] = useState<string>('english');
  const [error, setError] = useState<string | null>(null);

  // Load conversations on mount
  useEffect(() => {
    if (authToken) {
      loadConversations();
    }
  }, [authToken]);

  const loadConversations = async () => {
    setError(null);
    try {
      const response = await fetch('/api/assistant/conversations', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to load conversations');
      const data = await response.json();
      setConversations(data);
      
      // Auto-select first conversation if available
      if (data.length > 0 && !activeConversation) {
        setActiveConversation(data[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load conversations');
    }
  };

  const createNewConversation = async () => {
    try {
      const timestamp = new Date().toLocaleString();
      const response = await fetch('/api/assistant/conversations', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: `Conversation - ${timestamp}`,
          language,
        }),
      });

      if (!response.ok) throw new Error('Failed to create conversation');
      const newConversation = await response.json();
      
      setConversations([newConversation, ...conversations]);
      setActiveConversation(newConversation.id);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create conversation');
    }
  };

  const deleteConversation = async (conversationId: string) => {
    try {
      const response = await fetch(`/api/assistant/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) throw new Error('Failed to delete conversation');
      
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (activeConversation === conversationId) {
        setActiveConversation(conversations.length > 1 ? conversations[0].id : null);
      }
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete conversation');
    }
  };

  return (
    <div className="ai-assistant-container">
      <div className="ai-assistant-header">
        <h1>AI Financial Assistant</h1>
        <div className="language-selector">
          <label htmlFor="language-select">Language:</label>
          <select
            id="language-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="language-select"
          >
            <option value="english">English</option>
            <option value="spanish">Español</option>
            <option value="french">Français</option>
            <option value="hindi">हिंदी</option>
          </select>
        </div>
      </div>

      <div className="ai-assistant-content">
        <div className="ai-assistant-sidebar">
          <button
            className="new-conversation-btn"
            onClick={createNewConversation}
          >
            + New Conversation
          </button>

          <ConversationHistory
            conversations={conversations}
            activeConversation={activeConversation}
            onSelectConversation={setActiveConversation}
            onDeleteConversation={deleteConversation}
          />
        </div>

        <div className="ai-assistant-main">
          {error && <div className="error-message">{error}</div>}
          
          {activeConversation ? (
            <ChatInterface
              conversationId={activeConversation}
              language={language}
              authToken={authToken}
            />
          ) : (
            <div className="empty-state">
              <p>No active conversation. Create a new one to get started!</p>
              <button className="primary-btn" onClick={createNewConversation}>
                Start New Conversation
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
