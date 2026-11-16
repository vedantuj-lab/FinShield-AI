import React, { useState, useEffect } from 'react';
import './EMIPlanCalculator.css';

interface EMIScheduleItem {
  payment_number: number;
  due_date: string;
  opening_balance: number;
  emi_amount: number;
  principal_paid: number;
  interest_paid: number;
  closing_balance: number;
}

interface EMIPlan {
  id: string;
  loan_name: string;
  principal_amount: number;
  annual_interest_rate: number;
  tenure_months: number;
  monthly_emi: number;
  total_amount_payable: number;
  total_interest: number;
  start_date: string;
  next_emi_date?: string;
  amount_paid: number;
  remaining_amount: number;
  status: string;
  emi_schedule?: EMIScheduleItem[];
  created_at: string;
}

interface Props {
  businessProfileId: string;
}

const EMIPlanCalculator: React.FC<Props> = ({ businessProfileId }) => {
  const [plans, setPlans] = useState<EMIPlan[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<EMIPlan | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    loan_name: '',
    principal_amount: '',
    annual_interest_rate: '',
    tenure_months: '',
    start_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/emi', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlans(data);
        if (data.length > 0) {
          setSelectedPlan(data[0]);
        }
      }
    } catch (err) {
      console.error('Error fetching EMI plans:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.loan_name || !formData.principal_amount || !formData.annual_interest_rate || !formData.tenure_months) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        principal_amount: Number(formData.principal_amount),
        annual_interest_rate: Number(formData.annual_interest_rate),
        tenure_months: Number(formData.tenure_months),
      };

      const response = await fetch('/api/business/emi', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create EMI plan');
      }

      const newPlan = await response.json();
      setPlans([...plans, newPlan]);
      setSelectedPlan(newPlan);

      // Reset form
      setFormData({
        loan_name: '',
        principal_amount: '',
        annual_interest_rate: '',
        tenure_months: '',
        start_date: new Date().toISOString().split('T')[0],
      });
      setShowForm(false);
      alert('EMI plan created successfully!');
    } catch (err) {
      console.error('Error creating EMI plan:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="emi-plan-calculator">
      <div className="section-header">
        <h2>EMI Plan Calculator</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create EMI Plan'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="emi-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Loan Name *</label>
              <input
                type="text"
                name="loan_name"
                value={formData.loan_name}
                onChange={handleFormChange}
                placeholder="e.g., Business Loan 2024"
                required
              />
            </div>

            <div className="form-group">
              <label>Principal Amount (₹) *</label>
              <input
                type="number"
                name="principal_amount"
                value={formData.principal_amount}
                onChange={handleFormChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Annual Interest Rate (%) *</label>
              <input
                type="number"
                name="annual_interest_rate"
                value={formData.annual_interest_rate}
                onChange={handleFormChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div className="form-group">
              <label>Tenure (Months) *</label>
              <input
                type="number"
                name="tenure_months"
                value={formData.tenure_months}
                onChange={handleFormChange}
                placeholder="12"
                min="1"
                required
              />
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleFormChange}
                required
              />
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating...' : 'Create EMI Plan'}
          </button>
        </form>
      )}

      {selectedPlan && (
        <div className="emi-details">
          <div className="loan-header">
            <h3>{selectedPlan.loan_name}</h3>
            <span className={`status ${selectedPlan.status}`}>{selectedPlan.status}</span>
          </div>

          <div className="summary-cards">
            <div className="card">
              <h4>Principal Amount</h4>
              <p className="amount">₹{selectedPlan.principal_amount.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Monthly EMI</h4>
              <p className="amount">₹{selectedPlan.monthly_emi.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Total Interest</h4>
              <p className="amount">₹{selectedPlan.total_interest.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Total Amount Payable</h4>
              <p className="amount">₹{selectedPlan.total_amount_payable.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Tenure</h4>
              <p className="amount">{selectedPlan.tenure_months} months</p>
            </div>
            <div className="card">
              <h4>Interest Rate</h4>
              <p className="amount">{selectedPlan.annual_interest_rate}% p.a.</p>
            </div>
            <div className="card">
              <h4>Amount Paid</h4>
              <p className="amount">₹{selectedPlan.amount_paid.toFixed(2)}</p>
            </div>
            <div className="card">
              <h4>Remaining Amount</h4>
              <p className="amount">₹{selectedPlan.remaining_amount.toFixed(2)}</p>
            </div>
          </div>

          <div className="progress-section">
            <h3>Payment Progress</h3>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{
                  width: `${(selectedPlan.amount_paid / selectedPlan.total_amount_payable) * 100}%`,
                }}
              />
            </div>
            <p>
              {(selectedPlan.amount_paid / selectedPlan.total_amount_payable * 100).toFixed(1)}% Completed
            </p>
          </div>

          {selectedPlan.emi_schedule && selectedPlan.emi_schedule.length > 0 && (
            <div className="schedule-section">
              <h3>EMI Schedule</h3>
              <div className="table">
                <div className="table-header">
                  <div>Payment #</div>
                  <div>Due Date</div>
                  <div>Opening Balance</div>
                  <div>EMI Amount</div>
                  <div>Principal</div>
                  <div>Interest</div>
                  <div>Closing Balance</div>
                </div>
                {selectedPlan.emi_schedule.slice(0, 12).map((item, index) => (
                  <div key={index} className="table-row">
                    <div>{item.payment_number}</div>
                    <div>{new Date(item.due_date).toLocaleDateString()}</div>
                    <div>₹{item.opening_balance.toFixed(2)}</div>
                    <div>₹{item.emi_amount.toFixed(2)}</div>
                    <div className="principal">₹{item.principal_paid.toFixed(2)}</div>
                    <div className="interest">₹{item.interest_paid.toFixed(2)}</div>
                    <div>₹{item.closing_balance.toFixed(2)}</div>
                  </div>
                ))}
              </div>
              {selectedPlan.emi_schedule.length > 12 && (
                <p className="more-rows">
                  ... and {selectedPlan.emi_schedule.length - 12} more payments
                </p>
              )}
            </div>
          )}

          <div className="info-box">
            <h4>Key Information</h4>
            <ul>
              <li>Start Date: {new Date(selectedPlan.start_date).toLocaleDateString()}</li>
              <li>Next EMI Date: {selectedPlan.next_emi_date ? new Date(selectedPlan.next_emi_date).toLocaleDateString() : 'N/A'}</li>
              <li>EMI Amount: ₹{selectedPlan.monthly_emi.toFixed(2)} per month</li>
              <li>Total Tenure: {selectedPlan.tenure_months} months</li>
              <li>Total Interest: ₹{selectedPlan.total_interest.toFixed(2)}</li>
            </ul>
          </div>
        </div>
      )}

      {plans.length > 0 && (
        <div className="plans-list">
          <h3>Your EMI Plans ({plans.length})</h3>
          <div className="plan-selector">
            {plans.map(plan => (
              <button
                key={plan.id}
                className={`plan-item ${selectedPlan?.id === plan.id ? 'active' : ''}`}
                onClick={() => setSelectedPlan(plan)}
              >
                <div className="plan-title">{plan.loan_name}</div>
                <div className="plan-details">
                  <span>₹{plan.monthly_emi.toFixed(2)}/mo</span>
                  <span>{plan.tenure_months}mo</span>
                  <span>{plan.annual_interest_rate}%</span>
                </div>
                <div className={`plan-status ${plan.status}`}>{plan.status}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p>Loading EMI plans...</p>}

      {!selectedPlan && plans.length === 0 && !showForm && (
        <p className="no-data">No EMI plans yet. Create one to get started.</p>
      )}
    </div>
  );
};

export default EMIPlanCalculator;
