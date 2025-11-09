import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Mail, Phone, MapPin, Shield, TrendingUp, CreditCard, Users } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const LandingPage = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [bankInfo, setBankInfo] = useState([]);

  useEffect(() => {
    fetchEmployees();
    fetchBankInfo();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await axios.get(`${API}/employees`);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchBankInfo = async () => {
    try {
      const response = await axios.get(`${API}/bank-info`);
      setBankInfo(response.data);
    } catch (error) {
      console.error('Error fetching bank info:', error);
    }
  };

  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <h1 className="hero-title" data-testid="hero-title">
            Welcome to <span className="brand-name">SecureBank</span>
          </h1>
          <p className="hero-subtitle" data-testid="hero-subtitle">
            Your trusted partner in modern banking. Secure, fast, and always here for you.
          </p>
          <Button 
            onClick={() => navigate('/auth')} 
            className="cta-button"
            data-testid="get-started-btn"
          >
            Get Started
          </Button>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2 className="section-title">Why Choose Us</h2>
        <div className="features-grid">
          <Card className="feature-card" data-testid="feature-security">
            <CardContent className="feature-content">
              <Shield className="feature-icon" />
              <h3>Secure Banking</h3>
              <p>Bank-grade encryption and security protocols to keep your money safe</p>
            </CardContent>
          </Card>
          <Card className="feature-card" data-testid="feature-growth">
            <CardContent className="feature-content">
              <TrendingUp className="feature-icon" />
              <h3>Smart Investments</h3>
              <p>Grow your wealth with our intelligent investment solutions</p>
            </CardContent>
          </Card>
          <Card className="feature-card" data-testid="feature-cards">
            <CardContent className="feature-content">
              <CreditCard className="feature-icon" />
              <h3>Easy Payments</h3>
              <p>Quick and seamless transactions with our modern payment systems</p>
            </CardContent>
          </Card>
          <Card className="feature-card" data-testid="feature-support">
            <CardContent className="feature-content">
              <Users className="feature-icon" />
              <h3>24/7 Support</h3>
              <p>Our AI-powered support team is always ready to help you</p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Employees Section */}
      <section className="employees-section">
        <h2 className="section-title">Our Leadership Team</h2>
        <div className="employees-grid">
          {employees.map((employee) => (
            <Card key={employee.id} className="employee-card" data-testid={`employee-${employee.id}`}>
              <CardContent className="employee-content">
                <img src={employee.image} alt={employee.name} className="employee-image" />
                <h3 className="employee-name">{employee.name}</h3>
                <p className="employee-position">{employee.position}</p>
                <p className="employee-department">{employee.department}</p>
                <div className="employee-contact">
                  <span><Mail size={14} /> {employee.email}</span>
                  <span><Phone size={14} /> {employee.phone}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Bank Info Section */}
      <section className="bank-info-section">
        <h2 className="section-title">Our Branches</h2>
        <div className="bank-info-grid">
          {bankInfo.map((bank) => (
            <Card key={bank.id} className="bank-card" data-testid={`bank-${bank.id}`}>
              <CardContent className="bank-content">
                <h3 className="bank-name">{bank.name}</h3>
                <p className="bank-branch">{bank.branch}</p>
                <div className="bank-details">
                  <div className="bank-detail">
                    <MapPin size={16} />
                    <span>{bank.address}</span>
                  </div>
                  <div className="bank-detail">
                    <Phone size={16} />
                    <span>{bank.phone}</span>
                  </div>
                  <div className="bank-detail">
                    <Mail size={16} />
                    <span>{bank.email}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>Help & Support</h3>
            <ul>
              <li><a href="#faq">FAQ</a></li>
              <li><a href="#contact">Contact Us</a></li>
              <li><a href="#terms">Terms of Service</a></li>
              <li><a href="#privacy">Privacy Policy</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h3>Contact Information</h3>
            <p><Phone size={16} /> +1-555-BANK-HELP</p>
            <p><Mail size={16} /> support@securebank.com</p>
            <p><MapPin size={16} /> 123 Financial District, NY</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="#about">About Us</a></li>
              <li><a href="#careers">Careers</a></li>
              <li><a href="#news">News</a></li>
              <li><a href="#investors">Investors</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2025 SecureBank. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;