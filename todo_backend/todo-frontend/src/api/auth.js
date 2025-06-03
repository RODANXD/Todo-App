import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const authService = {
    async login(email, password) {
        const response = await axios.post(`${API_URL}/users/login/`, {
            email,
            password
        });
        if (response.data.token) {
            localStorage.setItem('user', JSON.stringify(response.data));
        }
        return response.data;
    },

    async register(username, email, password) {
        const response = await axios.post(`${API_URL}/users/register/`, {
            username,
            email,
            password
        });
        return response.data;
    },

    logout() {
        localStorage.removeItem('user');
    },

    getCurrentUser() {
        return JSON.parse(localStorage.getItem('user'));
    }
};

export default authService; 