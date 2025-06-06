import React from 'react'
import axios from 'axios'

const baseURL = 'http://0.0.0.0:8089/api/'

const axiosinstance = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    }
})

axiosinstance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        
        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;
            
            try {
                const refresh = localStorage.getItem('refresh_token');
                if (!refresh) {
                    throw new Error('No refresh token available');
                }
                
                const response = await axios.post(`${baseURL}users/token/refresh/`, { refresh });
                const { access } = response.data;
                
                localStorage.setItem('access_token', access);
                originalRequest.headers['Authorization'] = `Bearer ${access}`;
                
                return axiosinstance(originalRequest);
            } catch (refreshError) {
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                window.location.href = '/login';
                return Promise.reject(refreshError);
            }
        }
        
        return Promise.reject(error);
    }
);

axiosinstance.interceptors.request.use(
    (config) => {
        const access = localStorage.getItem('access_token');
        if (access) {
            config.headers['Authorization'] = `Bearer ${access}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Authentication APIs
export const register = (data) => axiosinstance.post('/users/register/', data);
export const login = (data) => axiosinstance.post('/users/login/', data);
export const refreshToken = (refresh) => axiosinstance.post('/users/token/refresh/', { refresh });
export const getProfile = () => axiosinstance.get('/users/profile/');

// Project APIs
export const getProjects = () => axiosinstance.get('/project/');
export const createProject = (data) => axiosinstance.post('/project/', data);
export const updateProject = (projectId, data) => axiosinstance.put(`/project/${projectId}/`, data);
export const deleteProject = (projectId) => axiosinstance.delete(`/project/${projectId}/`);

// TaskList APIs
export const getTaskLists = (projectId) => axiosinstance.get(`/tasks/?tasklist=${projectId}`);
export const validateTaskList = async (taskListId) => {
  try {
    // Update the endpoint to match your backend structure
    const response = await axiosinstance.get(`/project/task-lists/${taskListId}/`);
    return response.data;
  } catch (error) {
    console.error("Task list validation error:", error.response?.data || error.message);
    throw new Error("Invalid task list");
  }
};
export const createTaskWithList = async (data) => {
  try {
    // Validate required fields
    if (!data.task_list || !data.project) {
      throw new Error("Both project and task list IDs are required");
    }

    // Convert IDs to numbers for comparison
    const projectId = parseInt(data.project);
    const taskListId = parseInt(data.task_list);

    // Ensure project and task_list are different
    if (projectId === taskListId) {
      throw new Error("Project ID and Task List ID cannot be the same");
    }

    // Create task with validated data
    const response = await axiosinstance.post('/tasks/', {
      ...data,
      project: projectId,
      task_list: taskListId,
      status: data.status || 'todo'
    });

    return response;
  } catch (error) {
    console.error("Create task error:", error.message);
    throw error;
  }
};
export const getTasksByProject = (projectId) => axiosinstance.get(`/tasks/?project=${projectId}`);
export const createTaskList = (data) => axiosinstance.post(`/project/${data.project}/task-lists/`, data);
export const updateTaskList = (projectId, taskListId, data) => axiosinstance.put(`/project/${projectId}/task-lists/${taskListId}/`, data);
export const deleteTaskList = (projectId, taskListId) => axiosinstance.delete(`/project/${projectId}/task-lists/${taskListId}/`);

// Task APIs
export const getTasks = (taskListId) => axiosinstance.get(`/tasks/?tasklist=${taskListId}`);
export const createTask = (data) => axiosinstance.post('/tasks/', data);


export const updateTask = (taskId, data) => {
    const taskData = {
        ...data,
        project: parseInt(data.project),
        task_list: parseInt(data.task_list)
    };
    return axiosinstance.put(`/tasks/${taskId}/`, taskData);
}
export const deleteTask = (taskId) =>  axiosinstance.delete(`/tasks/${taskId}/`);
export const getTaskDetails = (taskId) => axiosinstance.get(`/tasks/${taskId}/`);
export const updateTaskStatus = (taskId, status) => axiosinstance.patch(`/tasks/${taskId}/`, { status });


export const getProjectMembers = (projectId) => 
  axiosinstance.get(`/project/${projectId}/members/`);
export const inviteTeamMember = async (projectId, data) => {
    return await axiosinstance.post(`/api/projects/${projectId}/invite/`, data);
};
export const updateMemberRole = async (projectId, memberId, role) => {
    return await axiosinstance.patch(`/api/projects/${projectId}/members/${memberId}/`, { role });
};

export const removeMember = async (projectId, memberId) => {
    return await axiosinstance.delete(`/api/projects/${projectId}/members/${memberId}/`);
};

export const updateTaskOrder = async (taskListId, taskIds) => {
    return await axiosinstance.post(`/api/tasklists/${taskListId}/reorder/`, { task_ids: taskIds });
};

export const updateSubTaskOrder = async (taskId, subTaskIds) => {
    return await axiosinstance.post(`/api/tasks/${taskId}/subtasks/reorder/`, { subtask_ids: subTaskIds });
};

export const logTime = async (taskId, duration) => {
    return await axiosinstance.post(`/api/tasks/${taskId}/log-time/`, { duration });
}; 

export const getTaskStats = async () => {
    return await axiosinstance.get('/tasks/stats/');
};

export default axiosinstance;

