import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContextP } from './store/AuthContext';
import PrivateRouter from './components/PrivateRouter';
import { KanbanProvider } from './components/kanban-provider';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import authService from './api/auth';
import './App.css';
import AnalyticsPage from './components/Analytics';
import CalendarPage from './components/Calender'; 
import { Toaster } from "sonner";
import { Accordion } from './components/ui/accordion';




const PrivateRoute = ({ children }) => {
  const user = authService.getCurrentUser();
  return user ? children : <Navigate to="/login" />;
};

const App = () => {
  return (
    <AuthContextP>
        <Toaster position="top-center" richColors />
      <KanbanProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/"
            element={
              <PrivateRouter>
                <Dashboard />
              </PrivateRouter>
            }
          />
          <Route
            path="/calender"
            element={
              <PrivateRouter>
                <CalendarPage />
              </PrivateRouter>
            }
          />
          <Route
            path="/analytics"
            element={
              <PrivateRouter>
                <AnalyticsPage />
              </PrivateRouter>
            }
          />
        </Routes>
      </KanbanProvider> 
    </AuthContextP>
  );
};

export default App;