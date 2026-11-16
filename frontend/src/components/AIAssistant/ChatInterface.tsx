import { useState, useEffect, useRef } from 'react';
import MessageBubble from './MessageBubble';
import IntentDisplay from './IntentDisplay';
import './ChatInterface.css';

interface Message {
  id: string;
  user_message: string;
  assistant_response: string;
  detected_intent: string | null;
  intent_confidence: number;
  module_routed_to: string | null;
  language: string;
  has_action: boolean;
  created_at: string;
}

interface ChatInterfaceProps {
  conversationId: string;
  language: string;
  authToken: string;
}

export default function ChatInterface({
  conversationId,
  language,
  authToken,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load messages when conversation changes
  useEffect(() => {
    loadMessages();
  }, [conversationId]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    try {
      const response = await fetch(
        `/api/assistant/conversations/${conversationId}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) throw new Error('Failed to load messages');
      const data = await response.json();
      setMessages(data.messages || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load messages');
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/assistant/chat/${conversationId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_message: inputValue,
            language,
          }),
        }
      );

      if (!response.ok) throw new Error('Failed to send message');
      const newMessage = await response.json();

      setMessages([...messages, newMessage]);
      setInputValue('');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="empty-chat">
            <p>Start a conversation with the AI assistant</p>
            <p className="text-muted">Ask questions about your finances!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div key={message.id} className="message-group">
              <MessageBubble
                type="user"
                content={message.user_message}
                timestamp={message.created_at}
              />
              <MessageBubble
                type="assistant"
                content={message.assistant_response}
                timestamp={message.created_at}
              />
              {message.detected_intent && (
                <IntentDisplay
                  intent={message.detected_intent}
                  confidence={message.intent_confidence}
                  moduleName={message.module_routed_to}
                />
              )}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input-form">
        {error && <div className="error-message">{error}</div>}
        <div className="input-wrapper">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your question..."
            disabled={loading}
            className="chat-input"
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="send-btn"
          >
            {loading ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
}
