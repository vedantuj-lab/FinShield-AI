import React, { useState, useEffect } from 'react';
import './IncomeExpenseTracker.css';

interface Transaction {
  id: string;
  transaction_date: string;
  amount: number;
  transaction_type: 'income' | 'expense';
  category: string;
  subcategory?: string;
  description: string;
  reference_number?: string;
  payment_method?: string;
  gst_amount: number;
  created_at: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  net_profit: number;
  total_gst: number;
  by_category: Record<string, number>;
  transaction_count: number;
}

interface Props {
  businessProfileId: string;
}

const IncomeExpenseTracker: React.FC<Props> = ({ businessProfileId }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().split('T')[0].substring(0, 7));

  const [formData, setFormData] = useState({
    transaction_date: new Date().toISOString().split('T')[0],
    amount: '',
    transaction_type: 'expense' as const,
    category: 'Salaries',
    subcategory: '',
    description: '',
    reference_number: '',
    payment_method: 'Bank Transfer',
    includes_gst: false,
    gst_rate: '0',
  });

  const expenseCategories = [
    'Salaries',
    'Rent',
    'Utilities',
    'Office Supplies',
    'Marketing',
    'Travel',
    'Maintenance',
    'Insurance',
    'Other Expense',
  ];

  const incomeCategories = [
    'Sales',
    'Services',
    'Consulting',
    'Interest Income',
    'Other Income',
  ];

  useEffect(() => {
    fetchTransactions();
    fetchSummary();
  }, [selectedMonth]);

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const queryParams = new URLSearchParams();
      if (filterType !== 'all') {
        queryParams.append('transaction_type', filterType);
      }

      const response = await fetch(`/api/business/income-expense?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/business/income-expense/summary?year_month=${selectedMonth}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name === 'includes_gst') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.amount || !formData.description) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        amount: Number(formData.amount),
        gst_rate: formData.includes_gst ? Number(formData.gst_rate) : null,
      };

      const response = await fetch('/api/business/income-expense', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to add transaction');
      }

      const newTransaction = await response.json();
      setTransactions([newTransaction, ...transactions]);

      // Reset form
      setFormData({
        transaction_date: new Date().toISOString().split('T')[0],
        amount: '',
        transaction_type: 'expense',
        category: 'Salaries',
        subcategory: '',
        description: '',
        reference_number: '',
        payment_method: 'Bank Transfer',
        includes_gst: false,
        gst_rate: '0',
      });
      setShowForm(false);
      alert('Transaction added successfully!');
      fetchSummary();
    } catch (err) {
      console.error('Error adding transaction:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const categories = (formData.transaction_type as string) === 'income' ? incomeCategories : expenseCategories;

  return (
    <div className="income-expense-tracker">
      <div className="section-header">
        <h2>Income & Expense Tracking</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Transaction'}
        </button>
      </div>

      {summary && (
        <div className="summary-cards">
          <div className="card">
            <h4>Total Income</h4>
            <p className="amount income">₹{summary.total_income.toFixed(2)}</p>
          </div>
          <div className="card">
            <h4>Total Expense</h4>
            <p className="amount expense">₹{summary.total_expense.toFixed(2)}</p>
          </div>
          <div className="card">
            <h4>Net Profit</h4>
            <p className={`amount ${summary.net_profit >= 0 ? 'profit' : 'loss'}`}>
              ₹{summary.net_profit.toFixed(2)}
            </p>
          </div>
          <div className="card">
            <h4>Total GST</h4>
            <p className="amount">₹{summary.total_gst.toFixed(2)}</p>
          </div>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="transaction-form">
          <div className="form-grid">
            <div className="form-group">
              <label>Transaction Date *</label>
              <input
                type="date"
                name="transaction_date"
                value={formData.transaction_date}
                onChange={handleFormChange}
                required
              />
            </div>

            <div className="form-group">
              <label>Type *</label>
              <select
                name="transaction_type"
                value={formData.transaction_type}
                onChange={handleFormChange}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>

            <div className="form-group">
              <label>Category *</label>
              <select
                name="category"
                value={formData.category}
                onChange={handleFormChange}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Amount (₹) *</label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleFormChange}
                placeholder="0.00"
                step="0.01"
                required
              />
            </div>

            <div className="form-group full-width">
              <label>Description *</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleFormChange}
                placeholder="Enter transaction details"
                required
              />
            </div>

            <div className="form-group">
              <label>Reference #</label>
              <input
                type="text"
                name="reference_number"
                value={formData.reference_number}
                onChange={handleFormChange}
                placeholder="INV-001 or Receipt #"
              />
            </div>

            <div className="form-group">
              <label>Payment Method</label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleFormChange}
              >
                <option value="Cash">Cash</option>
                <option value="Bank Transfer">Bank Transfer</option>
                <option value="Check">Check</option>
                <option value="Card">Card</option>
                <option value="UPI">UPI</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="includes_gst"
                  checked={formData.includes_gst}
                  onChange={handleFormChange}
                />
                Include GST
              </label>
            </div>

            {formData.includes_gst && (
              <div className="form-group">
                <label>GST Rate (%)</label>
                <select
                  name="gst_rate"
                  value={formData.gst_rate}
                  onChange={handleFormChange}
                >
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            )}
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Adding...' : 'Add Transaction'}
          </button>
        </form>
      )}

      <div className="filter-section">
        <label>Filter by Type:</label>
        <select value={filterType} onChange={(e) => { setFilterType(e.target.value); }}>
          <option value="all">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <label>Month:</label>
        <input
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        />
      </div>

      <div className="transactions-list">
        <h3>Recent Transactions ({transactions.length})</h3>
        {loading && <p>Loading transactions...</p>}
        {transactions.length === 0 ? (
          <p className="no-data">No transactions yet.</p>
        ) : (
          <div className="table">
            <div className="table-header">
              <div>Date</div>
              <div>Description</div>
              <div>Category</div>
              <div>Type</div>
              <div>Amount</div>
              <div>GST</div>
            </div>
            {transactions.slice(0, 10).map(transaction => (
              <div key={transaction.id} className="table-row">
                <div>{new Date(transaction.transaction_date).toLocaleDateString()}</div>
                <div>{transaction.description}</div>
                <div>{transaction.category}</div>
                <div className={`type ${transaction.transaction_type}`}>
                  {transaction.transaction_type}
                </div>
                <div className={`amount ${transaction.transaction_type}`}>
                  ₹{transaction.amount.toFixed(2)}
                </div>
                <div>₹{transaction.gst_amount.toFixed(2)}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default IncomeExpenseTracker;
