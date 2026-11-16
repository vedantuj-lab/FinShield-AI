import React, { useState, useEffect } from 'react';
import GSTInvoiceForm from './GSTInvoiceForm';
import IncomeExpenseTracker from './IncomeExpenseTracker';
import CashFlowForecastChart from './CashFlowForecastChart';
import EMIPlanCalculator from './EMIPlanCalculator';
import './SmallBusinessFinance.css';

interface BusinessProfile {
  id: string;
  business_name: string;
  category: string;
  gst_number: string;
  contact_email: string;
  financial_year: string;
}

const SmallBusinessFinance: React.FC = () => {
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [activeTab, setActiveTab] = useState<string>('profile');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const fetchBusinessProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/profile', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok && response.status !== 404) {
        throw new Error('Failed to fetch business profile');
      }

      if (response.ok) {
        const data = await response.json();
        setBusinessProfile(data);
      }
    } catch (err) {
      console.error('Error fetching business profile:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileCreated = (profile: BusinessProfile) => {
    setBusinessProfile(profile);
    setActiveTab('invoices');
  };

  return (
    <div className="small-business-finance">
      <div className="sbf-container">
        <div className="sbf-header">
          <h1>Small Business Finance</h1>
          <p>Manage invoices, track income/expenses, forecast cash flow, and calculate EMI</p>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
          </div>
        )}

        {loading && (
          <div className="loading-spinner">
            <p>Loading...</p>
          </div>
        )}

        {businessProfile ? (
          <div className="sbf-content">
            <div className="business-info-card">
              <h3>{businessProfile.business_name}</h3>
              <p>Category: {businessProfile.category}</p>
              {businessProfile.gst_number && <p>GST #: {businessProfile.gst_number}</p>}
              <p>F.Y.: {businessProfile.financial_year}</p>
            </div>

            <div className="sbf-tabs">
              <div className="sbf-tab-list">
                <button 
                  className={`tab-trigger ${activeTab === 'invoices' ? 'active' : ''}`}
                  onClick={() => setActiveTab('invoices')}
                >
                  GST Invoices
                </button>
                <button 
                  className={`tab-trigger ${activeTab === 'income-expense' ? 'active' : ''}`}
                  onClick={() => setActiveTab('income-expense')}
                >
                  Income & Expense
                </button>
                <button 
                  className={`tab-trigger ${activeTab === 'cash-flow' ? 'active' : ''}`}
                  onClick={() => setActiveTab('cash-flow')}
                >
                  Cash Flow
                </button>
                <button 
                  className={`tab-trigger ${activeTab === 'emi' ? 'active' : ''}`}
                  onClick={() => setActiveTab('emi')}
                >
                  EMI Plans
                </button>
              </div>

              <div className="tab-content">
                {activeTab === 'invoices' && (
                  <GSTInvoiceForm businessProfileId={businessProfile.id} />
                )}

                {activeTab === 'income-expense' && (
                  <IncomeExpenseTracker businessProfileId={businessProfile.id} />
                )}

                {activeTab === 'cash-flow' && (
                  <CashFlowForecastChart businessProfileId={businessProfile.id} />
                )}

                {activeTab === 'emi' && (
                  <EMIPlanCalculator businessProfileId={businessProfile.id} />
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="sbf-no-profile">
            <h2>Set up your business profile first</h2>
            <div className="profile-form-container">
              <BusinessProfileForm onProfileCreated={handleProfileCreated} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface BusinessProfileFormProps {
  onProfileCreated: (profile: BusinessProfile) => void;
}

const BusinessProfileForm: React.FC<BusinessProfileFormProps> = ({ onProfileCreated }) => {
  const [formData, setFormData] = useState({
    business_name: '',
    category: '',
    contact_email: '',
    contact_phone: '',
    gst_number: '',
    financial_year: new Date().getFullYear() + '-' + (new Date().getFullYear() + 1),
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/profile', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to create business profile');
      }

      const profile = await response.json();
      onProfileCreated(profile);
    } catch (err) {
      console.error('Error creating profile:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="business-profile-form">
      <div className="form-group">
        <label htmlFor="business_name">Business Name *</label>
        <input
          type="text"
          id="business_name"
          name="business_name"
          value={formData.business_name}
          onChange={handleChange}
          required
          placeholder="Enter your business name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select category</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="services">Services</option>
          <option value="manufacturing">Manufacturing</option>
          <option value="consulting">Consulting</option>
          <option value="trading">Trading</option>
          <option value="other">Other</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="contact_email">Email *</label>
        <input
          type="email"
          id="contact_email"
          name="contact_email"
          value={formData.contact_email}
          onChange={handleChange}
          required
          placeholder="your@email.com"
        />
      </div>

      <div className="form-group">
        <label htmlFor="contact_phone">Phone</label>
        <input
          type="tel"
          id="contact_phone"
          name="contact_phone"
          value={formData.contact_phone}
          onChange={handleChange}
          placeholder="+91-XXXXXXXXXX"
        />
      </div>

      <div className="form-group">
        <label htmlFor="gst_number">GST Number</label>
        <input
          type="text"
          id="gst_number"
          name="gst_number"
          value={formData.gst_number}
          onChange={handleChange}
          placeholder="27AABCT5055K1Z0"
        />
      </div>

      <div className="form-group">
        <label htmlFor="financial_year">Financial Year</label>
        <input
          type="text"
          id="financial_year"
          name="financial_year"
          value={formData.financial_year}
          onChange={handleChange}
          placeholder="2024-25"
        />
      </div>

      <button type="submit" disabled={loading} className="btn-primary">
        {loading ? 'Creating...' : 'Create Profile'}
      </button>
    </form>
  );
};

export default SmallBusinessFinance;
