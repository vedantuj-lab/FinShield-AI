import React, { useState, useEffect } from 'react';
import './CashFlowForecastChart.css';

interface ForecastData {
  month: string;
  opening_balance: number;
  inflows: number;
  outflows: number;
  closing_balance: number;
}

interface Forecast {
  id: string;
  forecast_date: string;
  start_month: string;
  end_month: string;
  forecast_months: number;
  forecast_data: ForecastData[];
  total_inflows: number;
  total_outflows: number;
  net_cash_flow: number;
  ending_balance: number;
}

interface Props {
  businessProfileId: string;
}

const CashFlowForecastChart: React.FC<Props> = ({ businessProfileId }) => {
  const [forecasts, setForecasts] = useState<Forecast[]>([]);
  const [selectedForecast, setSelectedForecast] = useState<Forecast | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    start_month: new Date().toISOString().split('T')[0].substring(0, 7),
    end_month: '',
    growth_rate: '0',
    seasonality_factor: '1.0',
    assumptions: '',
  });

  useEffect(() => {
    // Set default end_month to 3 months ahead
    const startDate = new Date(formData.start_month);
    const endDate = new Date(startDate.getFullYear(), startDate.getMonth() + 3, 1);
    const endMonth = endDate.toISOString().split('T')[0].substring(0, 7);
    setFormData(prev => ({ ...prev, end_month: endMonth }));

    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/cash-flow', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setForecasts(data);
        if (data.length > 0) {
          setSelectedForecast(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching forecasts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.start_month || !formData.end_month) {
      alert('Please select month range');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        growth_rate: Number(formData.growth_rate),
        seasonality_factor: Number(formData.seasonality_factor),
        assumptions: formData.assumptions ? JSON.parse(formData.assumptions) : {},
      };

      const response = await fetch('/api/business/cash-flow', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to generate forecast');
      }

      const newForecast = await response.json();
      setForecasts([...forecasts, newForecast]);
      setSelectedForecast(newForecast);

      // Reset form
      setFormData({
        start_month: new Date().toISOString().split('T')[0].substring(0, 7),
        end_month: '',
        growth_rate: '0',
        seasonality_factor: '1.0',
        assumptions: '',
      });
      setShowForm(false);
      alert('Forecast generated successfully!');
    } catch (err) {
      console.error('Error generating forecast:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const renderChart = () => {
    if (!selectedForecast || !selectedForecast.forecast_data) return null;

    const maxValue = Math.max(
      ...selectedForecast.forecast_data.map(d => Math.abs(d.closing_balance))
    );

    return (
      <div className="chart-container">
        <div className="chart">
          {selectedForecast.forecast_data.map((data, index) => (
            <div key={index} className="chart-bar-group">
              <div className="chart-bars">
                <div className="bar-column">
                  <div
                    className="bar inflows"
                    style={{
                      height: `${(data.inflows / (maxValue || 1)) * 100}%`,
                    }}
                    title={`Inflows: ₹${data.inflows.toFixed(2)}`}
                  />
                  <span className="bar-label">Inflows</span>
                </div>
                <div className="bar-column">
                  <div
                    className="bar outflows"
                    style={{
                      height: `${(data.outflows / (maxValue || 1)) * 100}%`,
                    }}
                    title={`Outflows: ₹${data.outflows.toFixed(2)}`}
                  />
                  <span className="bar-label">Outflows</span>
                </div>
                <div className="bar-column">
                  <div
                    className={`bar ${data.closing_balance >= 0 ? 'balance-positive' : 'balance-negative'}`}
                    style={{
                      height: `${(data.closing_balance / (maxValue || 1)) * 100}%`,
                    }}
                    title={`Balance: ₹${data.closing_balance.toFixed(2)}`}
                  />
                  <span className="bar-label">Balance</span>
                </div>
              </div>
              <div className="month-label">{data.month}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="cash-flow-forecast">
      <div className="section-header">
        <h2>Cash Flow Forecast</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Generate Forecast'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="forecast-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Start Month *</label>
              <input
                type="month"
                name="start_month"
                value={formData.start_month}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>End Month *</label>
              <input
                type="month"
                name="end_month"
                value={formData.end_month}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Growth Rate (%) *</label>
              <input
                type="number"
                name="growth_rate"
                value={formData.growth_rate}
                onChange={handleFormChange}
                placeholder="0"
                step="0.1"
              />
              <small>Expected monthly growth rate</small>
            </div>

            <div className="form-group">
              <label>Seasonality Factor</label>
              <input
                type="number"
                name="seasonality_factor"
                value={formData.seasonality_factor}
                onChange={handleFormChange}
                placeholder="1.0"
                step="0.1"
              />
              <small>1.0 = no seasonality, &gt;1.0 = seasonal increase</small>
            </div>

            <div className="form-group full-width">
              <label>Assumptions (JSON)</label>
              <textarea
                name="assumptions"
                value={formData.assumptions}
                onChange={handleFormChange}
                placeholder='{"key": "value"}'
              />
              <small>Optional: Add any forecast assumptions</small>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Generating...' : 'Generate Forecast'}
          </button>
        </form>
      )}

      {selectedForecast && (
        <div className="forecast-details">
          <div className="detail-cards">
            <div className="card">
              <h4>Total Inflows</h4>
              <p className="amount">₹{selectedForecast.total_inflows.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Total Outflows</h4>
              <p className="amount">₹{selectedForecast.total_outflows.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Net Cash Flow</h4>
              <p className={`amount ${selectedForecast.net_cash_flow >= 0 ? 'positive' : 'negative'}`}>
                ₹{selectedForecast.net_cash_flow.toFixed(2)}
              </p>
            </div>
            <div className="card">
              <h4>Ending Balance</h4>
              <p className={`amount ${selectedForecast.ending_balance >= 0 ? 'positive' : 'negative'}`}>
                ₹{selectedForecast.ending_balance.toFixed(2)}
              </p>
            </div>
          </div>

          <div className="chart-section">
            <h3>Forecast Chart</h3>
            {renderChart()}
          </div>

          <div className="forecast-table">
            <h3>Detailed Forecast</h3>
            <div className="table">
              <div className="table-header">
                <div>Month</div>
                <div>Opening Balance</div>
                <div>Inflows</div>
                <div>Outflows</div>
                <div>Closing Balance</div>
              </div>
              {selectedForecast.forecast_data.map((data, index) => (
                <div key={index} className="table-row">
                  <div>{data.month}</div>
                  <div>₹{data.opening_balance.toFixed(2)}</div>
                  <div className="inflow">₹{data.inflows.toFixed(2)}</div>
                  <div className="outflow">₹{data.outflows.toFixed(2)}</div>
                  <div className={data.closing_balance >= 0 ? 'positive' : 'negative'}>
                    ₹{data.closing_balance.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {forecasts.length > 0 && (
        <div className="forecasts-list">
          <h3>Previous Forecasts ({forecasts.length})</h3>
          <div className="forecast-selector">
            {forecasts.map(forecast => (
              <button
                key={forecast.id}
                className={`forecast-item ${selectedForecast?.id === forecast.id ? 'active' : ''}`}
                onClick={() => setSelectedForecast(forecast)}
              >
                <div className="forecast-title">
                  {forecast.start_month} to {forecast.end_month}
                </div>
                <div className="forecast-date">
                  {new Date(forecast.forecast_date).toLocaleDateString()}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p>Loading forecasts...</p>}
    </div>
  );
};

export default CashFlowForecastChart;
