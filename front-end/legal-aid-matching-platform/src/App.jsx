import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import SignIn from './SignIn.jsx';
import Signup from './signup.jsx';
import ForgotPassword from './ForgotPassword.jsx';
import ResetPassword from './ResetPassword.jsx';
import DashboardCitizen from './DashboardCitizen.jsx';
import DashboardLawyer from './DashboardLawyer.jsx';
import DashboardNgo from './DashboardNgo.jsx';
import DashboardAdmin from './DashboardAdmin.jsx';
import MyAppointments from './MyAppointments.jsx';
import AnalyticsDashboard from './AnalyticsDashboard.jsx';
import authService from './services/authService';

// Protected Route - redirects to signin if not authenticated
function ProtectedRoute({ children, requiredRole = null }) {
  const [isChecking, setIsChecking] = useState(true);
  const [isValidated, setIsValidated] = useState(false);
  
  useEffect(() => {
    // Validate authentication and role on mount
    const validateAuth = () => {
      const isAuthenticated = authService.isAuthenticated();
      const user = authService.getCurrentUser();
      
      if (isAuthenticated && user) {
        // If role is required, check if user has the correct role
        if (requiredRole && user.role !== requiredRole) {
          setIsValidated(false);
        } else {
          setIsValidated(true);
        }
      } else {
        setIsValidated(false);
      }
      setIsChecking(false);
    };
    
    validateAuth();
  }, [requiredRole]);
  
  if (isChecking) {
    // Show loading state while validating
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>Loading...</div>;
  }

  if (!isValidated) {
    return <Navigate to="/signin" replace />;
  }

  return children;
}

// Public Route - redirect to dashboard if already authenticated
function PublicRoute({ children }) {
  const user = authService.getCurrentUser();

  if (user) {
    if (user.role === 'CITIZEN') {
      return <Navigate to="/dashboard/citizen" replace />;
    } else if (user.role === 'LAWYER') {
      return <Navigate to="/dashboard/lawyer" replace />;
    } else if (user.role === 'NGO') {
      return <Navigate to="/dashboard/ngo" replace />;
    } else if (user.role === 'ADMIN') {
      return <Navigate to="/dashboard/admin" replace />;
    }
    return <Navigate to="/dashboard" replace />;
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
  } else if (user.role === 'ADMIN') {
    return <Navigate to="/dashboard/admin" replace />;
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
        <Route
          path="/forgot-password"
          element={
            <PublicRoute>
              <ForgotPassword />
            </PublicRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute>
              <ResetPassword />
            </PublicRoute>
          }
        />

        {/* Protected Routes - require authentication */}
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route
          path="/dashboard/citizen"
          element={
            <ProtectedRoute requiredRole="CITIZEN">
              <DashboardCitizen />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/lawyer"
          element={
            <ProtectedRoute requiredRole="LAWYER">
              <DashboardLawyer />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/ngo"
          element={
            <ProtectedRoute requiredRole="NGO">
              <DashboardNgo />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/admin"
          element={
            <ProtectedRoute requiredRole="ADMIN">
              <DashboardAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="/appointments"
          element={
            <ProtectedRoute>
              <MyAppointments />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;

