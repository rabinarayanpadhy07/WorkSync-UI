import axios from '@/config/axiosConfig';

export const signUpRequest = async ({ email, password, username }) => {
    try {
        const response = await axios.post('/users/signup', {
            email,
            password,
            username
        });
        return response.data;
    } catch(error) {
        console.error(error);
        throw error.response?.data || error;     
    }
};

export const signInRequest = async ({ email, password }) => {
    try {
        const response = await axios.post('/users/signin', {
            email,
            password
        });
        return response.data;
    } catch(error) {
        console.error(error);
        throw error.response?.data || error;     
    }
};

export const googleAuthExchangeRequest = async ({ code }) => {
    try {
        const response = await axios.post('/users/auth/google/exchange', { code });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error.response?.data || error;
    }
};

export const resetPasswordRequest = async ({ token, password }) => {
    try {
        const response = await axios.post('/users/reset-password', {
            token,
            password
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error.response?.data || error;
    }
};

export const updateProfileRequest = async ({ token, profilePicture }) => {
    try {
        const response = await axios.put('/users/profile', {
            profilePicture
        }, {
            headers: {
                'x-access-token': token
            }
        });
        return response.data;
    } catch (error) {
        console.error(error);
        throw error.response?.data || error;
    }
};
