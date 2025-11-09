import React, { useState } from 'react';
import axios from 'axios';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { Loader2, Upload } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AuthPage = ({ onLogin }) => {
  const [loading, setLoading] = useState(false);
  const [nidImage, setNidImage] = useState(null);
  const [nidPreview, setNidPreview] = useState(null);

  const [loginData, setLoginData] = useState({
    email: '',
    password: ''
  });

  const [registerData, setRegisterData] = useState({
    name: '',
    email: '',
    address: '',
    nid_number: '',
    monthly_income: '',
    gender: '',
    password: '',
    confirmPassword: ''
  });

  const handleNidUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNidImage(reader.result);
        setNidPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/auth/login`, loginData);
      toast.success('Login successful!');
      onLogin(response.data.token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (registerData.password !== registerData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const data = {
        name: registerData.name,
        email: registerData.email,
        address: registerData.address,
        nid_number: registerData.nid_number,
        nid_image: nidImage,
        monthly_income: parseFloat(registerData.monthly_income),
        gender: registerData.gender,
        password: registerData.password
      };

      const response = await axios.post(`${API}/auth/register`, data);
      toast.success('Registration successful!');
      onLogin(response.data.token);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1 className="auth-logo" data-testid="auth-logo">SecureBank</h1>
          <p className="auth-tagline">Secure Banking for Modern Life</p>
        </div>

        <Card className="auth-card">
          <Tabs defaultValue="login" className="auth-tabs">
            <TabsList className="auth-tabs-list">
              <TabsTrigger value="login" data-testid="login-tab">Sign In</TabsTrigger>
              <TabsTrigger value="register" data-testid="register-tab">Sign Up</TabsTrigger>
            </TabsList>

            {/* Login Tab */}
            <TabsContent value="login">
              <CardHeader>
                <CardTitle data-testid="login-title">Welcome Back</CardTitle>
                <CardDescription>Sign in to access your account</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleLogin} className="auth-form">
                  <div className="form-group">
                    <Label htmlFor="login-email">Email</Label>
                    <Input
                      id="login-email"
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.email}
                      onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                      required
                      data-testid="login-email-input"
                    />
                  </div>
                  <div className="form-group">
                    <Label htmlFor="login-password">Password</Label>
                    <Input
                      id="login-password"
                      type="password"
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      data-testid="login-password-input"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="auth-submit-btn" 
                    disabled={loading}
                    data-testid="login-submit-btn"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={16} /> Signing in...</> : 'Sign In'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>

            {/* Register Tab */}
            <TabsContent value="register">
              <CardHeader>
                <CardTitle data-testid="register-title">Create Account</CardTitle>
                <CardDescription>Join us and start banking smarter</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleRegister} className="auth-form">
                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="name">Full Name</Label>
                      <Input
                        id="name"
                        placeholder="John Doe"
                        value={registerData.name}
                        onChange={(e) => setRegisterData({ ...registerData, name: e.target.value })}
                        required
                        data-testid="register-name-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={registerData.email}
                        onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                        required
                        data-testid="register-email-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="123 Main St, City, State"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({ ...registerData, address: e.target.value })}
                      required
                      data-testid="register-address-input"
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="nid">NID Number</Label>
                      <Input
                        id="nid"
                        placeholder="NID-123456"
                        value={registerData.nid_number}
                        onChange={(e) => setRegisterData({ ...registerData, nid_number: e.target.value })}
                        required
                        data-testid="register-nid-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="income">Monthly Income ($)</Label>
                      <Input
                        id="income"
                        type="number"
                        placeholder="5000"
                        value={registerData.monthly_income}
                        onChange={(e) => setRegisterData({ ...registerData, monthly_income: e.target.value })}
                        required
                        data-testid="register-income-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="nid-upload">NID Picture (Optional)</Label>
                    <div className="file-upload-area" data-testid="nid-upload-area">
                      <input
                        id="nid-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleNidUpload}
                        className="file-input"
                        data-testid="nid-upload-input"
                      />
                      <label htmlFor="nid-upload" className="file-upload-label">
                        <Upload size={20} />
                        {nidPreview ? 'Change Image' : 'Upload NID Image'}
                      </label>
                      {nidPreview && (
                        <img src={nidPreview} alt="NID Preview" className="nid-preview" data-testid="nid-preview" />
                      )}
                    </div>
                  </div>

                  <div className="form-group">
                    <Label htmlFor="gender">Gender</Label>
                    <Select 
                      value={registerData.gender} 
                      onValueChange={(value) => setRegisterData({ ...registerData, gender: value })}
                      required
                    >
                      <SelectTrigger data-testid="register-gender-select">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male" data-testid="gender-male">Male</SelectItem>
                        <SelectItem value="female" data-testid="gender-female">Female</SelectItem>
                        <SelectItem value="other" data-testid="gender-other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <Label htmlFor="password">Password</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.password}
                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                        required
                        data-testid="register-password-input"
                      />
                    </div>
                    <div className="form-group">
                      <Label htmlFor="confirm-password">Confirm Password</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={registerData.confirmPassword}
                        onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                        required
                        data-testid="register-confirm-password-input"
                      />
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="auth-submit-btn" 
                    disabled={loading}
                    data-testid="register-submit-btn"
                  >
                    {loading ? <><Loader2 className="animate-spin" size={16} /> Creating account...</> : 'Create Account'}
                  </Button>
                </form>
              </CardContent>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;