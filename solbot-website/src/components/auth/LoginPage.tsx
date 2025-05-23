import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  InputAdornment,
  IconButton,
  Paper,
  useMediaQuery,
  useTheme,
  Alert,
  CircularProgress,
} from '@mui/material';
import { Visibility, VisibilityOff, Email, Lock } from '@mui/icons-material';
import styled from 'styled-components';
import solbotLogo from '../../assets/images/solbot-logo.png';
import { login, isAuthenticated } from '../../services/authService';

interface StyledProps {
  isMobile?: boolean;
}

const StyledContainer = styled(Container)`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: linear-gradient(135deg, #f5f7fa 0%, #e4e8f0 100%);
`;

const LoginBox = styled(Paper)<StyledProps>`
  display: flex;
  flex-direction: ${props => props.isMobile ? 'column' : 'row'};
  width: 100%;
  max-width: 1100px;
  min-height: ${props => props.isMobile ? 'auto' : '600px'};
  overflow: hidden;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
`;

const LogoSection = styled(Box)<StyledProps>`
  flex: ${props => props.isMobile ? '0 0 200px' : '1'};
  background: linear-gradient(135deg, #000080 0%, #1a237e 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: ${props => props.isMobile ? '2rem 1rem' : '3rem 2rem'};
  color: white;
  position: relative;
  overflow: hidden;
  
  &:before {
    content: '';
    position: absolute;
    top: -50px;
    left: -50px;
    width: 200px;
    height: 200px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.05);
  }
  
  &:after {
    content: '';
    position: absolute;
    bottom: -100px;
    right: -100px;
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background-color: rgba(255, 255, 255, 0.05);
  }
`;

const FormSection = styled(Box)<StyledProps>`
  flex: ${props => props.isMobile ? 'auto' : '1.2'};
  padding: ${props => props.isMobile ? '2rem 1.5rem' : '3rem 4rem'};
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Logo = styled.img<StyledProps>`
  width: ${props => props.isMobile ? '80px' : '120px'};
  height: auto;
  margin-bottom: 1.5rem;
  z-index: 1;
`;

const StyledTextField = styled(TextField)`
  margin-bottom: 1.5rem;
  
  .MuiOutlinedInput-root {
    border-radius: 12px;
    background-color: #f8f9fa;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
    
    &:hover .MuiOutlinedInput-notchedOutline {
      border-color: #000080;
    }
    
    &.Mui-focused {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05);
    }
    
    &.Mui-focused .MuiOutlinedInput-notchedOutline {
      border-color: #000080;
      border-width: 2px;
    }
  }
  
  .MuiInputLabel-root.Mui-focused {
    color: #000080;
  }
`;

const StyledButton = styled(Button)<StyledProps>`
  border-radius: 12px;
  padding: ${props => props.isMobile ? '10px' : '14px'};
  font-weight: 600;
  text-transform: none;
  font-size: ${props => props.isMobile ? '15px' : '16px'};
  background: linear-gradient(90deg, #000080 0%, #1a237e 100%);
  box-shadow: 0 4px 10px rgba(0, 0, 128, 0.2);
  transition: all 0.3s ease;
  letter-spacing: 0.5px;
  
  &:hover {
    background: linear-gradient(90deg, #1a237e 0%, #000080 100%);
    box-shadow: 0 6px 15px rgba(0, 0, 128, 0.3);
    transform: translateY(-3px);
  }
  
  &:active {
    transform: translateY(-1px);
  }
`;

const ForgotPassword = styled(Typography)`
  text-align: right;
  color: #000080;
  cursor: pointer;
  margin-bottom: 2rem;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    color: #1a237e;
    text-decoration: underline;
  }
`;

interface FormData {
  email: string;
  password: string;
}

interface FormErrors {
  email: string;
  password: string;
}

const LoginPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState<boolean>(false);
  const [formData, setFormData] = useState<FormData>({
    email: 'khoiadjatesnim@gmail.com',
    password: 'solbot123',
  });
  const [formErrors, setFormErrors] = useState<FormErrors>({
    email: '',
    password: '',
  });
  
  // Check if user is already logged in
  useEffect(() => {
    if (isAuthenticated()) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = (): boolean => {
    let valid = true;
    const errors: FormErrors = {
      email: '',
      password: '',
    };
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
      valid = false;
    } else if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
      valid = false;
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
      valid = false;
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
      valid = false;
    }
    
    setFormErrors(errors);
    return valid;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    
    // Clear error when user types
    if (formErrors[e.target.name as keyof FormErrors]) {
      setFormErrors({
        ...formErrors,
        [e.target.name]: '',
      });
    }
    
    // Clear general error message
    if (error) {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await login(formData.email, formData.password);
      console.log('Login successful:', response);
      if (response.token) {
        localStorage.setItem('token', response.token);
      }
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err.message && err.message.includes('password')) {
        setError('Invalid email or password');
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = (): void => {
    navigate('/forgot-password');
  };

  return (
    <StyledContainer maxWidth={false}>
      <LoginBox isMobile={isMobile}>
        <LogoSection isMobile={isMobile}>
          <Logo src={solbotLogo} alt="SolBot Logo" isMobile={isMobile} />
          <Typography variant="h4" component="h1" gutterBottom>
            Welcome Back
          </Typography>
          <Typography variant="body1" align="center">
            Sign in to continue to your SolBot dashboard
          </Typography>
        </LogoSection>
        
        <FormSection isMobile={isMobile}>
          <Typography variant="h5" component="h2" gutterBottom>
            Sign In
          </Typography>
          
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <form onSubmit={handleSubmit}>
            <StyledTextField
              fullWidth
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              error={!!formErrors.email}
              helperText={formErrors.email}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email color="action" />
                  </InputAdornment>
                ),
              }}
            />
            
            <StyledTextField
              fullWidth
              label="Password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              value={formData.password}
              onChange={handleChange}
              error={!!formErrors.password}
              helperText={formErrors.password}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <ForgotPassword onClick={handleForgotPassword}>
              Forgot Password?
            </ForgotPassword>
            
            <StyledButton
              fullWidth
              type="submit"
              variant="contained"
              disabled={loading}
              isMobile={isMobile}
            >
              {loading ? (
                <CircularProgress size={24} color="inherit" />
              ) : (
                'Sign In'
              )}
            </StyledButton>
          </form>
        </FormSection>
      </LoginBox>
    </StyledContainer>
  );
};

export default LoginPage;
