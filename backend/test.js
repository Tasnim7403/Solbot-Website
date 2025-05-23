const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

// Test user registration
const testRegister = async () => {
    try {
        const response = await axios.post(`${API_URL}/auth/register`, {
            name: 'Test User',
            email: 'test@example.com',
            password: 'password123',
            role: 'user'
        });

        console.log('Registration successful:', response.data);
        return response.data.token;
    } catch (error) {
        console.error('Registration failed:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Test user login
const testLogin = async () => {
    try {
        const response = await axios.post(`${API_URL}/auth/login`, {
            email: 'test@example.com',
            password: 'password123'
        });

        console.log('Login successful:', response.data);
        return response.data.token;
    } catch (error) {
        console.error('Login failed:', error.response ? error.response.data : error.message);
        return null;
    }
};

// Test getting user profile
const testGetProfile = async (token) => {
    try {
        const response = await axios.get(`${API_URL}/auth/me`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('Profile retrieved successfully:', response.data);
    } catch (error) {
        console.error('Profile retrieval failed:', error.response ? error.response.data : error.message);
    }
};

// Run tests
const runTests = async () => {
    console.log('=== Testing Authentication API ===');

    // Test registration
    console.log('\n--- Testing Registration ---');
    const registerToken = await testRegister();

    // Test login
    console.log('\n--- Testing Login ---');
    const loginToken = await testLogin();

    // Test profile retrieval
    if (loginToken) {
        console.log('\n--- Testing Profile Retrieval ---');
        await testGetProfile(loginToken);
    }

    console.log('\n=== Tests Completed ===');
};

runTests();
