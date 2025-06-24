import axiosinstance from './AxiosAuth';

// Calendar Event APIs
export const getCalendarEvents = (startDate, endDate) => 
  axiosinstance.get(`/scheduling/events/?start_date=${startDate}&end_date=${endDate}`);

export const createEvent = (eventData) => 
  axiosinstance.post('/scheduling/events/', eventData);

export const updateEvent = (eventId, eventData) => 
  axiosinstance.put(`/scheduling/events/${eventId}/`, eventData);

export const deleteEvent = (eventId) => 
  axiosinstance.delete(`/scheduling/events/${eventId}/`);

// Event Participant APIs
export const addParticipant = (eventId, userId) => 
  axiosinstance.post(`/scheduling/events/${eventId}/participants/`, { user: userId });

export const removeParticipant = (eventId, participantId) => 
  axiosinstance.delete(`/scheduling/events/${eventId}/participants/${participantId}/`);

// Event Notification APIs
export const getNotifications = () => 
  axiosinstance.get('/scheduling/notifications/');

export const markNotificationAsRead = (notificationId) => 
  axiosinstance.patch(`/scheduling/notifications/${notificationId}/`, { read: true });

export const markAllNotificationsAsRead = () => 
  axiosinstance.post('/scheduling/notifications/mark-all-read/');

// User Availability APIs
export const getUserAvailability = (date) => 
  axiosinstance.get(`/scheduling/availability/?date=${date}`);