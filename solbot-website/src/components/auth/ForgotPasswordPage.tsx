import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Typography,
  Container,
  Paper,
  Alert,
} from '@mui/material';
import styled from 'styled-components';
import solbotLogo from '../../assets/images/solbot-logo.png';

const StyledContainer = styled(Container)`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ResetBox = styled(Paper)`
  display: flex;
  width: 100%;
  min-height: 500px;
  overflow: hidden;
  border-radius: 16px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
`;

const LogoSection = styled(Box)`
  flex: 1;
  background-color: #000080;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: white;
`;

const FormSection = styled(Box)`
  flex: 1;
  padding: 3rem;
  display: flex;
  flex-direction: column;
  justify-content: center;
`;

const Logo = styled.img`
  width: 120px;
  height: auto;
  margin-bottom: 1rem;
`;

const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:5000/api/auth/forgotpassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to send reset email');
      }

      setSuccess(true);
      setEmail('');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <StyledContainer maxWidth="lg">
      <ResetBox>
        <LogoSection>
          <Logo src={solbotLogo} alt="SolBot Logo" />
          <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
            SolBot
          </Typography>
        </LogoSection>
        <FormSection>
          <Typography variant="h4" component="h2" sx={{ mb: 4, fontWeight: 'bold' }}>
            Reset Password
          </Typography>
          <Typography variant="body1" sx={{ mb: 3, color: 'text.secondary' }}>
            Enter your email address to receive a password reset link
          </Typography>

          {success ? (
            <Alert severity="success" sx={{ mb: 3 }}>
              An email has been sent with instructions to reset your password
            </Alert>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <Alert severity="error" sx={{ mb: 3 }}>
                  {error}
                </Alert>
              )}
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                margin="normal"
                variant="outlined"
                required
                sx={{ mb: 2 }}
              />
              <Button
                fullWidth
                type="submit"
                variant="contained"
                color="primary"
                size="large"
                disabled={loading}
                sx={{ mt: 3, mb: 2 }}
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          )}
        </FormSection>
      </ResetBox>
    </StyledContainer>
  );
};

export default ForgotPasswordPage;
