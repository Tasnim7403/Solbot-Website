import axios from 'axios';

const API_URL = 'http://localhost:5000/api/auth';

export interface User {
    token: string;
    name?: string;
    email?: string;
    role?: string;
    profileImage?: string;
}

export interface UserData {
    name?: string;
    email?: string;
    password?: string;
}

export interface PasswordData {
    currentPassword: string;
    newPassword: string;
}

export interface AuthResponse {
    token: string;
    user: User;
}

// Register user
export const register = async (userData: UserData): Promise<AuthResponse> => {
    try {
        const response = await axios.post(`${API_URL}/register`, userData);

        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }

        return response.data;
    } catch (error: any) {
        throw error.response ? error.response.data : new Error('Server error');
    }
};

// Login user
export const login = async (email: string, password: string): Promise<AuthResponse> => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        const { token, user } = response.data;

        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        }

        localStorage.setItem('token', token);

        return response.data;
    } catch (error: any) {
        throw error.response ? error.response.data : new Error('Server error');
    }
};

// Logout user
export const logout = async (): Promise<void> => {
    try {
        const user = getCurrentUser();
        if (user && user.token) {
            await axios.post(`${API_URL}/logout`, {}, {
                headers: getAuthHeader()
            });
        }
    } catch (error) {
        console.error('Logout error:', error);
    } finally {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
    }
};

// Get current user
export const getCurrentUser = (): User | null => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

// Check if user is authenticated
export const isAuthenticated = (): boolean => {
    return !!localStorage.getItem('token');
};

// Get auth header
export const getAuthHeader = (): { Authorization?: string } => {
    const token = localStorage.getItem('token');
    if (token) {
        return { Authorization: `Bearer ${token}` };
    } else {
        return {};
    }
};

// Get user profile
export const getUserProfile = async (): Promise<User> => {
    try {
        const response = await axios.get(`${API_URL}/me`, {
            headers: getAuthHeader()
        });

        return response.data;
    } catch (error: any) {
        throw error.response ? error.response.data : new Error('Server error');
    }
};

// Update user profile
export const updateUserProfile = async (userData: UserData): Promise<User> => {
    try {
        const response = await axios.put(`${API_URL}/me`, userData, {
            headers: getAuthHeader()
        });

        const user = getCurrentUser();
        if (user) {
            const updatedUser = {
                ...user,
                name: userData.name,
                email: userData.email
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        return response.data;
    } catch (error: any) {
        throw error.response ? error.response.data : new Error('Server error');
    }
};

// Update password
export const updatePassword = async (passwordData: PasswordData): Promise<{ message: string }> => {
    try {
        const response = await axios.put(`${API_URL}/password`, passwordData, {
            headers: getAuthHeader()
        });

        return response.data;
    } catch (error: any) {
        throw error.response ? error.response.data : new Error('Server error');
    }
};

// Upload profile photo
export const uploadProfilePhoto = async (formData: FormData): Promise<{ message: string; profileImage: string }> => {
    try {
        const response = await axios.post(`${API_URL}/upload-photo`, formData, {
            headers: {
                ...getAuthHeader(),
                'Content-Type': 'multipart/form-data'
            }
        });

        // Update the user object in localStorage with the new profile image
        const user = getCurrentUser();
        if (user) {
            const updatedUser = {
                ...user,
                profileImage: response.data.profileImage
            };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }

        return response.data;
    } catch (error: any) {
        throw error.response ? error.response.data : new Error('Server error');
    }
}; 