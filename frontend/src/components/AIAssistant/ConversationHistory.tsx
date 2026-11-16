import './ConversationHistory.css';

interface Conversation {
  id: string;
  title: string;
  language: string;
  created_at: string;
}

interface ConversationHistoryProps {
  conversations: Conversation[];
  activeConversation: string | null;
  onSelectConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
}

export default function ConversationHistory({
  conversations,
  activeConversation,
  onSelectConversation,
  onDeleteConversation,
}: ConversationHistoryProps) {
  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  return (
    <div className="conversation-history">
      <h3>Conversations</h3>
      {conversations.length === 0 ? (
        <div className="empty-history">
          <p>No conversations yet</p>
        </div>
      ) : (
        <ul className="conversation-list">
          {conversations.map((conv) => (
            <li
              key={conv.id}
              className={`conversation-item ${
                activeConversation === conv.id ? 'active' : ''
              }`}
            >
              <button
                className="conversation-button"
                onClick={() => onSelectConversation(conv.id)}
              >
                <div className="conversation-title">{conv.title}</div>
                <div className="conversation-date">{formatDate(conv.created_at)}</div>
              </button>
              <button
                className="delete-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  if (
                    window.confirm('Are you sure you want to delete this conversation?')
                  ) {
                    onDeleteConversation(conv.id);
                  }
                }}
                title="Delete conversation"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
