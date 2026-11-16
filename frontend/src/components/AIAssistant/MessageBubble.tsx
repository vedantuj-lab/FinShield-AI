import './MessageBubble.css';

interface MessageBubbleProps {
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function MessageBubble({
  type,
  content,
  timestamp,
}: MessageBubbleProps) {
  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`message-bubble message-${type}`}>
      <div className="message-content">
        <div className="message-text">{content}</div>
        <span className="message-time">{formatTime(timestamp)}</span>
      </div>
    </div>
  );
}
