import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import SignIn from './SignIn';
import Signup from './signup';
import DashboardCitizen from './DashboardCitizen';
import DashboardLawyer from './DashboardLawyer';
import DashboardNgo from './DashboardNgo';
import authService from './services/authService';

// Protected route wrapper that redirects based on role
function DashboardRedirect() {
  const navigate = useNavigate();
  const user = authService.getCurrentUser();
  
  React.useEffect(() => {
    if (!user) {
      navigate('/signin');
    } else {
      switch (user.role) {
        case 'CITIZEN':
          navigate('/dashboard/citizen', { replace: true });
          break;
        case 'LAWYER':
          navigate('/dashboard/lawyer', { replace: true });
          break;
        case 'NGO':
          navigate('/dashboard/ngo', { replace: true });
          break;
        default:
          navigate('/signin', { replace: true });
      }
    }
  }, [user, navigate]);
  
  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/dashboard/citizen" element={<DashboardCitizen />} />
        <Route path="/dashboard/lawyer" element={<DashboardLawyer />} />
        <Route path="/dashboard/ngo" element={<DashboardNgo />} />
        <Route path="/" element={<Navigate to="/signin" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

