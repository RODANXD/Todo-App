import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const getAuthHeader = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.token) {
        return { Authorization: `Bearer ${user.token}` };
    }
    return {};
};

const projectService = {
    async getProjects() {
        const response = await axios.get(`${API_URL}/projects/`, {
            headers: getAuthHeader()
        });
        return response.data;
    },

    async createProject(title, description) {
        const response = await axios.post(
            `${API_URL}/projects/`,
            { title, description },
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    async updateProject(id, data) {
        const response = await axios.put(
            `${API_URL}/projects/${id}/`,
            data,
            { headers: getAuthHeader() }
        );
        return response.data;
    },

    async deleteProject(id) {
        const response = await axios.delete(
            `${API_URL}/projects/${id}/`,
            { headers: getAuthHeader() }
        );
        return response.data;
    }
};

export default projectService; 