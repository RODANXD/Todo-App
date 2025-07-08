import React from 'react'
import axios from 'axios'


const baseURL = `${import.meta.env.VITE_BACKENDURL}api/`
// const baseURL = 'https://3njncz1t-8000.inc1.devtunnels.ms/api/'


const axiosinstance = axios.create({
    baseURL,
    timeout: 5000,
    headers: {
        'Content-Type': 'application/json',
    },
    withCredentials: true
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
                // window.location.href = '/login';
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


axiosinstance.interceptors.request.use(
  (config) => {
    const access = localStorage.getItem('access_token');
    if (access) {
      config.headers['Authorization'] = `Bearer ${access}`;
    }
    
    // Don't set Content-Type for FormData - browser will set it automatically with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const updateProfile = (data) => {
  console.log("updateprofile data:", data)

  if (data instanceof FormData) {
    return axiosinstance.patch('/auth/profile/update/', data,{timeout:20000});
  }

  return axiosinstance.patch('/auth/profile/update/', data, {
    headers: {
      'Content-Type': 'application/json'
    }
  });
};

// Authentication APIs
export const register = (data) => axiosinstance.post('/users/register/', data);
export const login = (data) => axiosinstance.post('/users/login/', data);
export const refreshToken = (refresh) => axiosinstance.post('/users/token/refresh/', { refresh });
export const getProfile = () => axiosinstance.get('/auth/profile/');


export const changePassword = (data) => axiosinstance.patch('/auth/profile/update_password/', data);

// Project APIs
export const getProjects = () => axiosinstance.get('/project/');
export const createProject = (data) => axiosinstance.post('/project/', data);
export const updateProject = (projectId, data) => axiosinstance.put(`/project/${projectId}/`, data);
export const deleteProject = (projectId) => axiosinstance.delete(`/project/${projectId}/`);
export const duplicateproject = (projectId) => axiosinstance.post(`/project/${projectId}/duplicate/`);

export const createOrganizationid = (data) => axiosinstance.post('/organizations/', data);
export const getOrganization = (organizationid) => axiosinstance.get(`/organizations/`);
export const updateOrganization = (organizationid, data) => axiosinstance.patch(`/organizations/${organizationid}/`, data) 
// export const createOrganizatio = (organizationid, data) => axiosinstance.patch(`/organizations/${organizationid}/`, data) 
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

    // const formattedData = {
    //   title: data.title,
    //   description: data.description || "",
    //   status: data.status || "todo",
    //   priority: data.priority || "medium",
    //   due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
    //   project: parseInt(data.project),
    //   task_list: parseInt(data.task_list),
    //   assigned_to: data.assigned_to || null,
    //   dependencies: Array.isArray(data.dependencies) ? data.dependencies : []
    // };

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


export const updateTask = async (taskId, data) => {
  try {
    const formattedData = {
      title: data.title,
      description: data.description || "",
      status: data.status || "todo",
      priority: data.priority || "medium",
      due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      project: parseInt(data.project),
      task_list: parseInt(data.task_list),
      assigned_to: data.assigned_to || null,
      dependencies: Array.isArray(data.dependencies) ? data.dependencies : []
    };

    return await axiosinstance.patch(`/tasks/${taskId}/`, formattedData);
  } catch (error) {
    console.error("Update task error:", error.response?.data || error.message);
    throw error;
  }
};


export const updateTaskPriority = async (taskId, status) => {
  try {
    return await axiosinstance.patch(`/tasks/${taskId}/`, { status });
  } catch (error) {
    console.error("Update task priority error:", error.response?.data || error.message);
    throw error;
  }
}

export const deleteTask = (taskId) =>  axiosinstance.delete(`/tasks/${taskId}/`);
export const getTaskDetails = (taskId) => axiosinstance.get(`/tasks/${taskId}/`);
export const updateTaskStatus = (taskId, status) => axiosinstance.patch(`/tasks/${taskId}/`, { status });




// Task Approval Api
export const createTaskRequest = (data) => axiosinstance.post('/task-requests/', data);
export const getTaskRequests = () => axiosinstance.get('/task-requests/');
export const approveTaskRequest = (id) => axiosinstance.post(`/task-requests/${id}/approve/`);
export const rejectTaskRequest = (id) => axiosinstance.post(`/task-requests/${id}/reject/`);


// timelog api
export const timelogs = (data) => axiosinstance.post(`/tasks/timelogs/`, data);




export const getProjectMembers = (projectId) => 
  axiosinstance.get(`/project/${projectId}/members/`);
export const inviteTeamMember = async (orgId, data) => {
    return await axiosinstance.post(`/organizations/${orgId}/invitations/`, data);
};
export const directprojectinvite = async (projectId, data) => {
  console.log("Direct invite data:", data);
    return await  axiosinstance.post(`/project/${projectId}/members/`, data);

};
export const updateMemberRole = async (projectId, memberId, role) => {
    return await axiosinstance.patch(`/project/${projectId}/members/${memberId}/`, { role });
};

export const removeMember = async (projectId, memberId) => {
    return await axiosinstance.delete(`/project/${projectId}/members/${memberId}/`);
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

export const getAllEmails = async () =>{
  return await axiosinstance.get('/auth/profile/all_user_emails/')
}
export const getalluser = async () =>{
  return await axiosinstance.get('/auth/profile/all_username/')
}


export const uploadChatAttachment = (projectId, formData) => {
  const access = localStorage.getItem('access_token');
  return axios.post(
    `${import.meta.env.VITE_BACKENDURL}api/project/${projectId}/chat/attachments/`,
    formData,
    {
      headers: {
        'Authorization': `Bearer ${access}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  );
};


export const getCalendarEvents = (startDate, endDate) => 
  axiosinstance.get(`/scheduling/events/?start_date=${startDate}&end_date=${endDate}`);

export const createEvent = (eventData) => 
  axiosinstance.post('/scheduling/events/', eventData);

export const updateEvent = (eventId, eventData) => 
  axiosinstance.patch(`/scheduling/events/${eventId}/`, eventData);

export const deleteEvent = (eventId) => 
  axiosinstance.delete(`/scheduling/events/${eventId}/`);


export const addParticipant = (eventId, userId) => 
  axiosinstance.post(`/scheduling/events/${eventId}/participants/`, { user: userId });

export const removeParticipant = (eventId, participantId) => 
  axiosinstance.delete(`/scheduling/events/${eventId}/participants/${participantId}/`);


export default axiosinstance;

