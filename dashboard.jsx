import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { 
  LogOut, User, CreditCard, TrendingUp, DollarSign, 
  FileText, Send, MessageCircle, X, Loader2, Receipt,
  Building, Calendar, CheckCircle, Clock, Upload
} from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const Dashboard = ({ token, onLogout }) => {
  const [profile, setProfile] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loans, setLoans] = useState([]);
  const [cards, setCards] = useState([]);
  const [kyc, setKyc] = useState(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [loanForm, setLoanForm] = useState({ amount: '', duration_months: '' });
  const [kycDocument, setKycDocument] = useState(null);
  const [kycPreview, setKycPreview] = useState(null);

  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, accountsRes, transactionsRes, loansRes, cardsRes, kycRes] = await Promise.all([
        axios.get(`${API}/user/profile`, axiosConfig),
        axios.get(`${API}/accounts`, axiosConfig),
        axios.get(`${API}/transactions`, axiosConfig),
        axios.get(`${API}/loans`, axiosConfig),
        axios.get(`${API}/cards`, axiosConfig),
        axios.get(`${API}/kyc`, axiosConfig)
      ]);

      setProfile(profileRes.data);
      setAccounts(accountsRes.data);
      setTransactions(transactionsRes.data);
      setLoans(loansRes.data);
      setCards(cardsRes.data);
      setKyc(kycRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      if (error.response?.status === 401) {
        toast.error('Session expired. Please login again.');
        onLogout();
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatMessage.trim()) return;

    const userMsg = chatMessage;
    setChatHistory([...chatHistory, { type: 'user', text: userMsg }]);
    setChatMessage('');
    setChatLoading(true);

    try {
      const response = await axios.post(
        `${API}/chat`,
        { message: userMsg },
        axiosConfig
      );
      setChatHistory(prev => [...prev, { type: 'bot', text: response.data.response }]);
    } catch (error) {
      toast.error('Failed to send message');
      setChatHistory(prev => [...prev, { type: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleApplyLoan = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/loans`, loanForm, axiosConfig);
      toast.success('Loan application submitted successfully!');
      setLoanForm({ amount: '', duration_months: '' });
      fetchData();
    } catch (error) {
      toast.error('Failed to submit loan application');
    }
  };

  const handleKycUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setKycDocument(reader.result);
        setKycPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateKyc = async () => {
    if (!kycDocument) {
      toast.error('Please upload a document');
      return;
    }

    try {
      const documents = kyc?.documents ? [...kyc.documents, kycDocument] : [kycDocument];
      await axios.put(`${API}/kyc`, { documents }, axiosConfig);
      toast.success('KYC updated successfully!');
      setKycDocument(null);
      setKycPreview(null);
      fetchData();
    } catch (error) {
      toast.error('Failed to update KYC');
    }
  };

  const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

  return (
    <div className="dashboard" data-testid="dashboard">
      {/* Header */}
      <header className="dashboard-header">
        <div className="dashboard-header-content">
          <h1 className="dashboard-logo" data-testid="dashboard-logo">SecureBank</h1>
          <div className="dashboard-user">
            <span className="user-name" data-testid="user-name">{profile?.name}</span>
            <Button 
              onClick={onLogout} 
              variant="outline" 
              size="sm" 
              className="logout-btn"
              data-testid="logout-btn"
            >
              <LogOut size={16} /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="dashboard-container">
        {/* Balance Cards */}
        <div className="balance-section">
          <Card className="balance-card" data-testid="balance-card">
            <CardContent className="balance-content">
              <DollarSign className="balance-icon" />
              <div>
                <p className="balance-label">Total Balance</p>
                <h2 className="balance-amount" data-testid="total-balance">${totalBalance.toFixed(2)}</h2>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="dashboard-tabs">
          <TabsList className="dashboard-tabs-list">
            <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
            <TabsTrigger value="accounts" data-testid="tab-accounts">Accounts</TabsTrigger>
            <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            <TabsTrigger value="loans" data-testid="tab-loans">Loans</TabsTrigger>
            <TabsTrigger value="cards" data-testid="tab-cards">Cards</TabsTrigger>
            <TabsTrigger value="kyc" data-testid="tab-kyc">KYC</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="tab-content">
            <div className="overview-grid">
              <Card className="info-card" data-testid="customer-info-card">
                <CardHeader>
                  <CardTitle><User size={20} /> Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="info-content">
                  <div className="info-row">
                    <span className="info-label">Name:</span>
                    <span className="info-value" data-testid="customer-name">{profile?.name}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email:</span>
                    <span className="info-value" data-testid="customer-email">{profile?.email}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Address:</span>
                    <span className="info-value" data-testid="customer-address">{profile?.address}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">NID:</span>
                    <span className="info-value" data-testid="customer-nid">{profile?.nid_number}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Gender:</span>
                    <span className="info-value" data-testid="customer-gender">{profile?.gender}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Monthly Income:</span>
                    <span className="info-value" data-testid="customer-income">${profile?.monthly_income}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="info-card" data-testid="quick-stats-card">
                <CardHeader>
                  <CardTitle><TrendingUp size={20} /> Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="stats-content">
                  <div className="stat-item">
                    <Building className="stat-icon" />
                    <div>
                      <p className="stat-label">Active Accounts</p>
                      <p className="stat-value" data-testid="active-accounts">{accounts.length}</p>
                    </div>
                  </div>
                  <div className="stat-item">
                    <CreditCard className="stat-icon" />
                    <div>
                      <p className="stat-label">Active Cards</p>
                      <p className="stat-value" data-testid="active-cards">{cards.length}</p>
                    </div>
                  </div>
                  <div className="stat-item">
                    <Receipt className="stat-icon" />
                    <div>
                      <p className="stat-label">Recent Transactions</p>
                      <p className="stat-value" data-testid="recent-transactions">{transactions.length}</p>
                    </div>
                  </div>
                  <div className="stat-item">
                    <FileText className="stat-icon" />
                    <div>
                      <p className="stat-label">Active Loans</p>
                      <p className="stat-value" data-testid="active-loans">{loans.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Accounts Tab */}
          <TabsContent value="accounts" className="tab-content">
            <div className="accounts-grid">
              {accounts.map((account) => (
                <Card key={account.id} className="account-card" data-testid={`account-${account.id}`}>
                  <CardContent className="account-content">
                    <div className="account-header">
                      <Building size={24} className="account-icon" />
                      <span className="account-type">{account.account_type}</span>
                    </div>
                    <p className="account-number" data-testid={`account-number-${account.id}`}>{account.account_number}</p>
                    <h3 className="account-balance" data-testid={`account-balance-${account.id}`}>${account.balance.toFixed(2)}</h3>
                    <p className="account-date">Opened: {new Date(account.created_at).toLocaleDateString()}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="tab-content">
            <Card className="transactions-card">
              <CardHeader>
                <CardTitle>Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="transactions-list">
                  {transactions.length === 0 ? (
                    <p className="empty-state" data-testid="no-transactions">No transactions yet</p>
                  ) : (
                    transactions.map((transaction) => (
                      <div key={transaction.id} className="transaction-item" data-testid={`transaction-${transaction.id}`}>
                        <div className="transaction-info">
                          <Receipt size={20} className={`transaction-icon ${transaction.type}`} />
                          <div>
                            <p className="transaction-description" data-testid={`transaction-desc-${transaction.id}`}>{transaction.description}</p>
                            <p className="transaction-date">{new Date(transaction.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <span className={`transaction-amount ${transaction.type}`} data-testid={`transaction-amount-${transaction.id}`}>
                          {transaction.type === 'credit' ? '+' : '-'}${transaction.amount.toFixed(2)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loans Tab */}
          <TabsContent value="loans" className="tab-content">
            <div className="loans-section">
              <Card className="apply-loan-card">
                <CardHeader>
                  <CardTitle>Apply for Loan</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleApplyLoan} className="loan-form">
                    <div className="form-group">
                      <Label htmlFor="loan-amount">Loan Amount ($)</Label>
                      <Input
                        id="loan-amount"
                        type="number"
                        placeholder="10000"
                        value={loanForm.amount}
                        onChange={(e) => setLoanForm({ ...loanForm, amount: e.target.value })}
                        required
                        data-testid="loan-amount-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="loan-duration">Duration (Months)</Label>
                      <Input
                        id="loan-duration"
                        type="number"
                        placeholder="12"
                        value={loanForm.duration_months}
                        onChange={(e) => setLoanForm({ ...loanForm, duration_months: e.target.value })}
                        required
                        data-testid="loan-duration-input"
                      />
                    </div>
                    <Button type="submit" className="loan-submit-btn" data-testid="loan-submit-btn">
                      Apply Now
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <div className="loans-list">
                {loans.map((loan) => (
                  <Card key={loan.id} className="loan-card" data-testid={`loan-${loan.id}`}>
                    <CardContent className="loan-content">
                      <div className="loan-header">
                        <h3 className="loan-amount" data-testid={`loan-amount-${loan.id}`}>${loan.amount.toFixed(2)}</h3>
                        <span className={`loan-status ${loan.status}`} data-testid={`loan-status-${loan.id}`}>
                          {loan.status === 'approved' && <CheckCircle size={16} />}
                          {loan.status === 'pending' && <Clock size={16} />}
                          {loan.status}
                        </span>
                      </div>
                      <div className="loan-details">
                        <div className="loan-detail">
                          <span className="loan-label">Interest Rate:</span>
                          <span className="loan-value">{loan.interest_rate}%</span>
                        </div>
                        <div className="loan-detail">
                          <span className="loan-label">Duration:</span>
                          <span className="loan-value">{loan.duration_months} months</span>
                        </div>
                        <div className="loan-detail">
                          <span className="loan-label">Applied:</span>
                          <span className="loan-value">{new Date(loan.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Cards Tab */}
          <TabsContent value="cards" className="tab-content">
            <div className="cards-grid">
              {cards.map((card) => (
                <Card key={card.id} className="card-item" data-testid={`card-${card.id}`}>
                  <CardContent className="card-content">
                    <div className="card-type-badge" data-testid={`card-type-${card.id}`}>{card.card_type}</div>
                    <CreditCard size={32} className="card-icon" />
                    <p className="card-number" data-testid={`card-number-${card.id}`}>**** **** **** {card.card_number.slice(-4)}</p>
                    <div className="card-details">
                      <div>
                        <p className="card-label">Expiry</p>
                        <p className="card-value" data-testid={`card-expiry-${card.id}`}>{card.expiry_date}</p>
                      </div>
                      <div>
                        <p className="card-label">CVV</p>
                        <p className="card-value">***</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* KYC Tab */}
          <TabsContent value="kyc" className="tab-content">
            <Card className="kyc-card">
              <CardHeader>
                <CardTitle>KYC Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="kyc-status">
                  <span className="kyc-label">Status:</span>
                  <span className={`kyc-status-badge ${kyc?.status}`} data-testid="kyc-status">
                    {kyc?.status === 'verified' && <CheckCircle size={16} />}
                    {kyc?.status === 'pending' && <Clock size={16} />}
                    {kyc?.status}
                  </span>
                </div>
                <div className="kyc-upload-section">
                  <Label htmlFor="kyc-upload">Upload Additional Documents</Label>
                  <div className="file-upload-area">
                    <input
                      id="kyc-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleKycUpload}
                      className="file-input"
                      data-testid="kyc-upload-input"
                    />
                    <label htmlFor="kyc-upload" className="file-upload-label">
                      <Upload size={20} />
                      {kycPreview ? 'Change Document' : 'Upload Document'}
                    </label>
                    {kycPreview && (
                      <img src={kycPreview} alt="Document Preview" className="kyc-preview" data-testid="kyc-preview" />
                    )}
                  </div>
                  {kycDocument && (
                    <Button onClick={handleUpdateKyc} className="kyc-update-btn" data-testid="kyc-update-btn">
                      Update KYC
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* AI Chat Widget */}
      <div className={`chat-widget ${chatOpen ? 'open' : ''}`} data-testid="chat-widget">
        {chatOpen ? (
          <Card className="chat-card">
            <CardHeader className="chat-header">
              <CardTitle className="chat-title">
                <MessageCircle size={20} /> Live Support
              </CardTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setChatOpen(false)} 
                className="chat-close"
                data-testid="chat-close-btn"
              >
                <X size={20} />
              </Button>
            </CardHeader>
            <CardContent className="chat-content">
              <div className="chat-messages" data-testid="chat-messages">
                {chatHistory.length === 0 && (
                  <p className="chat-welcome">Hello! How can I help you today?</p>
                )}
                {chatHistory.map((msg, idx) => (
                  <div key={idx} className={`chat-message ${msg.type}`} data-testid={`chat-message-${idx}`}>
                    <p>{msg.text}</p>
                  </div>
                ))}
                {chatLoading && (
                  <div className="chat-message bot" data-testid="chat-loading">
                    <Loader2 className="animate-spin" size={16} /> Typing...
                  </div>
                )}
              </div>
              <div className="chat-input-container">
                <Input
                  placeholder="Type your message..."
                  value={chatMessage}
                  onChange={(e) => setChatMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={chatLoading}
                  data-testid="chat-input"
                />
                <Button 
                  onClick={handleSendMessage} 
                  disabled={chatLoading}
                  className="chat-send-btn"
                  data-testid="chat-send-btn"
                >
                  <Send size={16} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Button 
            onClick={() => setChatOpen(true)} 
            className="chat-trigger"
            data-testid="chat-open-btn"
          >
            <MessageCircle size={24} />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Dashboard;