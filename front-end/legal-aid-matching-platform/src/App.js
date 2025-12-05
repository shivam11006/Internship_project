import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './SignIn';
import Signup from './signup';
import DashboardCitizen from './DashboardCitizen';
import DashboardLawyer from './DashboardLawyer';
import DashboardNgo from './DashboardNgo';
import authService from './services/authService';

// Protected Route - redirects to signin if not authenticated
function ProtectedRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }
  
  return children;
}

// Public Route - redirects to dashboard if already authenticated
function PublicRoute({ children }) {
  const isAuthenticated = authService.isAuthenticated();
  
  if (isAuthenticated) {
    const user = authService.getCurrentUser();
    if (user?.role === 'CITIZEN') {
      return <Navigate to="/dashboard/citizen" replace />;
    } else if (user?.role === 'LAWYER') {
      return <Navigate to="/dashboard/lawyer" replace />;
    } else if (user?.role === 'NGO') {
      return <Navigate to="/dashboard/ngo" replace />;
    }
  }
  
  return children;
}

// Dashboard redirect based on user role
function DashboardRedirect() {
  const user = authService.getCurrentUser();
  
  if (!user) {
    return <Navigate to="/signin" replace />;
  }
  
  if (user.role === 'CITIZEN') {
    return <Navigate to="/dashboard/citizen" replace />;
  } else if (user.role === 'LAWYER') {
    return <Navigate to="/dashboard/lawyer" replace />;
  } else if (user.role === 'NGO') {
    return <Navigate to="/dashboard/ngo" replace />;
  }
  
  return <Navigate to="/signin" replace />;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/signin" replace />} />
        
        {/* Public Routes - redirect to dashboard if logged in */}
        <Route 
          path="/signin" 
          element={
            <PublicRoute>
              <SignIn />
            </PublicRoute>
          } 
        />
        <Route 
          path="/signup" 
          element={
            <PublicRoute>
              <Signup />
            </PublicRoute>
          } 
        />
        
        {/* Protected Routes - require authentication */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route 
          path="/dashboard/citizen" 
          element={
            <ProtectedRoute>
              <DashboardCitizen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/lawyer" 
          element={
            <ProtectedRoute>
              <DashboardLawyer />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/dashboard/ngo" 
          element={
            <ProtectedRoute>
              <DashboardNgo />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;

