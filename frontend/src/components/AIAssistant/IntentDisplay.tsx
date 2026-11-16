import './IntentDisplay.css';

interface IntentDisplayProps {
  intent: string;
  confidence: number;
  moduleName: string | null;
}

const intentIcons: Record<string, string> = {
  budget: '💰',
  investment: '📈',
  trading: '📊',
  tax: '📋',
  fraud: '🔒',
  business: '🏢',
  general: '❓',
};

const intentLabels: Record<string, string> = {
  budget: 'Budget Assistant',
  investment: 'Investment Assistant',
  trading: 'Trading Assistant',
  tax: 'Tax Assistant',
  fraud: 'Fraud Detection',
  business: 'Business Finance',
  general: 'General Assistance',
};

export default function IntentDisplay({
  intent,
  confidence,
  moduleName,
}: IntentDisplayProps) {
  const confidencePercent = Math.round(confidence * 100);
  const icon = intentIcons[intent] || '❓';
  const label = intentLabels[intent] || intent;

  return (
    <div className="intent-display">
      <div className="intent-badge">
        <span className="intent-icon">{icon}</span>
        <div className="intent-info">
          <div className="intent-label">{label}</div>
          <div className="confidence-bar">
            <div
              className="confidence-fill"
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
          <span className="confidence-text">{confidencePercent}% confidence</span>
        </div>
      </div>
      {moduleName && (
        <div className="action-info">
          <span className="action-icon">➜</span>
          <span className="module-name">Routing to {moduleName} module</span>
        </div>
      )}
    </div>
  );
}
