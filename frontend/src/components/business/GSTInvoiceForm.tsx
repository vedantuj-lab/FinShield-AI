import React, { useState, useEffect } from 'react';
import './GSTInvoiceForm.css';

interface InvoiceItem {
  description: string;
  hsn_code?: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
}

interface GSTInvoice {
  id: string;
  invoice_number: string;
  invoice_date: string;
  customer_name: string;
  subtotal: number;
  sgst_amount: number;
  cgst_amount: number;
  igst_amount: number;
  total_amount: number;
  gst_rate: number;
  payment_status: string;
  status: string;
}

interface Props {
  businessProfileId: string;
}

const GSTInvoiceForm: React.FC<Props> = ({ businessProfileId }) => {
  const [invoices, setInvoices] = useState<GSTInvoice[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([{ description: '', hsn_code: '', quantity: 1, unit_price: 0, tax_rate: 18 }]);
  const [formData, setFormData] = useState({
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: '',
    customer_name: '',
    customer_gstin: '',
    customer_address: '',
    customer_phone: '',
    customer_email: '',
    gst_rate: 18,
  });

  useEffect(() => {
    fetchInvoices();
  }, []);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/business/invoices', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setInvoices(data);
      }
    } catch (err) {
      console.error('Error fetching invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { description: '', hsn_code: '', quantity: 1, unit_price: 0, tax_rate: 18 }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  };

  const calculateGST = (rate: number) => {
    return (calculateSubtotal() * rate) / 100;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (items.length === 0 || !formData.invoice_number || !formData.customer_name) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const payload = {
        ...formData,
        items: items,
        gst_rate: Number(formData.gst_rate),
      };

      const response = await fetch('/api/business/invoices', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Failed to create invoice');
      }

      const newInvoice = await response.json();
      setInvoices([...invoices, newInvoice]);
      
      // Reset form
      setItems([{ description: '', hsn_code: '', quantity: 1, unit_price: 0, tax_rate: 18 }]);
      setFormData({
        invoice_number: '',
        invoice_date: new Date().toISOString().split('T')[0],
        due_date: '',
        customer_name: '',
        customer_gstin: '',
        customer_address: '',
        customer_phone: '',
        customer_email: '',
        gst_rate: 18,
      });
      setShowForm(false);
      alert('Invoice created successfully!');
    } catch (err) {
      console.error('Error creating invoice:', err);
      alert(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const subtotal = calculateSubtotal();
  const gstAmount = calculateGST(Number(formData.gst_rate));
  const total = subtotal + gstAmount;

  return (
    <div className="gst-invoice-form">
      <div className="section-header">
        <h2>GST Invoices</h2>
        <button className="btn-secondary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Create Invoice'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="invoice-form-container">
          <div className="form-section">
            <h3>Invoice Details</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>Invoice Number *</label>
                <input
                  type="text"
                  name="invoice_number"
                  value={formData.invoice_number}
                  onChange={handleFormChange}
                  required
                  placeholder="INV-001"
                />
              </div>

              <div className="form-group">
                <label>Invoice Date *</label>
                <input
                  type="date"
                  name="invoice_date"
                  value={formData.invoice_date}
                  onChange={handleFormChange}
                  required
                />
              </div>

              <div className="form-group">
                <label>Due Date</label>
                <input
                  type="date"
                  name="due_date"
                  value={formData.due_date}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-group">
                <label>GST Rate (%)</label>
                <select name="gst_rate" value={formData.gst_rate} onChange={handleFormChange}>
                  <option value="5">5%</option>
                  <option value="12">12%</option>
                  <option value="18">18%</option>
                  <option value="28">28%</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Customer Details</h3>
            <div className="form-grid">
              <div className="form-group full-width">
                <label>Customer Name *</label>
                <input
                  type="text"
                  name="customer_name"
                  value={formData.customer_name}
                  onChange={handleFormChange}
                  required
                  placeholder="ABC Company"
                />
              </div>

              <div className="form-group">
                <label>GSTIN</label>
                <input
                  type="text"
                  name="customer_gstin"
                  value={formData.customer_gstin}
                  onChange={handleFormChange}
                  placeholder="27AABCT5055K1Z0"
                />
              </div>

              <div className="form-group">
                <label>Email</label>
                <input
                  type="email"
                  name="customer_email"
                  value={formData.customer_email}
                  onChange={handleFormChange}
                  placeholder="customer@email.com"
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="customer_phone"
                  value={formData.customer_phone}
                  onChange={handleFormChange}
                  placeholder="+91-XXXXXXXXXX"
                />
              </div>

              <div className="form-group full-width">
                <label>Address</label>
                <input
                  type="text"
                  name="customer_address"
                  value={formData.customer_address}
                  onChange={handleFormChange}
                  placeholder="123 Main Street, City"
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Invoice Items</h3>
            <div className="items-table">
              <div className="table-header">
                <div>Description</div>
                <div>HSN Code</div>
                <div>Quantity</div>
                <div>Unit Price</div>
                <div>Tax Rate</div>
                <div>Amount</div>
                <div>Action</div>
              </div>

              {items.map((item, index) => (
                <div key={index} className="table-row">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                    placeholder="Product/Service"
                    required
                  />
                  <input
                    type="text"
                    value={item.hsn_code || ''}
                    onChange={(e) => handleItemChange(index, 'hsn_code', e.target.value)}
                    placeholder="HSN Code"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                    min="1"
                    required
                  />
                  <input
                    type="number"
                    value={item.unit_price}
                    onChange={(e) => handleItemChange(index, 'unit_price', Number(e.target.value))}
                    placeholder="0.00"
                    step="0.01"
                    required
                  />
                  <select
                    value={item.tax_rate}
                    onChange={(e) => handleItemChange(index, 'tax_rate', Number(e.target.value))}
                  >
                    <option value="5">5%</option>
                    <option value="12">12%</option>
                    <option value="18">18%</option>
                    <option value="28">28%</option>
                  </select>
                  <div className="amount">{(item.quantity * item.unit_price).toFixed(2)}</div>
                  <button type="button" onClick={() => removeItem(index)} className="btn-danger-small">
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <button type="button" onClick={addItem} className="btn-secondary-small">
              + Add Item
            </button>
          </div>

          <div className="summary">
            <div className="summary-row">
              <span>Subtotal:</span>
              <strong>₹{subtotal.toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>SGST (½ of GST):</span>
              <strong>₹{(gstAmount / 2).toFixed(2)}</strong>
            </div>
            <div className="summary-row">
              <span>CGST (½ of GST):</span>
              <strong>₹{(gstAmount / 2).toFixed(2)}</strong>
            </div>
            <div className="summary-row total">
              <span>Total Amount:</span>
              <strong>₹{total.toFixed(2)}</strong>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Creating Invoice...' : 'Create Invoice'}
          </button>
        </form>
      )}

      <div className="invoices-list">
        <h3>Recent Invoices ({invoices.length})</h3>
        {loading && <p>Loading invoices...</p>}
        {invoices.length === 0 ? (
          <p className="no-data">No invoices yet. Create one to get started.</p>
        ) : (
          <div className="table">
            <div className="table-header">
              <div>Invoice #</div>
              <div>Customer</div>
              <div>Date</div>
              <div>Amount</div>
              <div>Status</div>
            </div>
            {invoices.slice(0, 5).map(invoice => (
              <div key={invoice.id} className="table-row">
                <div>{invoice.invoice_number}</div>
                <div>{invoice.customer_name}</div>
                <div>{new Date(invoice.invoice_date).toLocaleDateString()}</div>
                <div>₹{invoice.total_amount.toFixed(2)}</div>
                <div className={`status ${invoice.payment_status}`}>{invoice.payment_status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default GSTInvoiceForm;
