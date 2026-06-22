import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RoleRoute from './RoleRoute';
import CandidateForm from '../pages/CandidateForm';
import HrDashboard from '../pages/dashboards/HrDashboard';
import TechDashboard from '../pages/dashboards/TechDashboard';
import AdminDashboard from '../pages/dashboards/AdminDashboard';
import ReceptionistDashboard from '../pages/dashboards/ReceptionistDashboard';
import CandidateSearch from '../pages/CandidateSearch';
import CandidateProfile from '../pages/CandidateProfile';
import LandingPage from '../pages/LandingPage';
import InterviewWorkspace from '../pages/InterviewWorkspace';
import InterviewEvaluation from '../pages/InterviewEvaluation';
import Analytics from '../pages/Analytics';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-candidate" element={<CandidateForm />} />

      {/* Protected Routes Wrapper */}
      <Route element={<ProtectedRoute />}>
        {/* Layout Wrapper */}
        <Route element={<DashboardLayout />}>
          
          {/* Receptionist Routes */}
          <Route element={<RoleRoute allowedRoles={['RECEPTIONIST']} />}>
            <Route path="/receptionist/dashboard" element={<ReceptionistDashboard />} />
          </Route>

          {/* HR Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['HR_ADMIN']} />}>
            <Route path="/hr/dashboard" element={<HrDashboard />} />
            {/* HR specific routes */}
          </Route>

          {/* Tech Head / Interviewer Routes */}
          <Route element={<RoleRoute allowedRoles={['INTERVIEWER']} />}>
            <Route path="/tech/dashboard" element={<TechDashboard />} />
          </Route>

          {/* System Admin Routes */}
          <Route element={<RoleRoute allowedRoles={['SYSTEM_ADMIN']} />}>
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
          </Route>

          {/* Shared Routes */}
          <Route element={<RoleRoute allowedRoles={['HR_ADMIN', 'INTERVIEWER', 'SYSTEM_ADMIN', 'RECEPTIONIST']} />}>
            <Route path="/candidates" element={<CandidateSearch />} />
            <Route path="/candidates/:id" element={<CandidateProfile />} />
          </Route>
          
          <Route element={<RoleRoute allowedRoles={['HR_ADMIN', 'INTERVIEWER']} />}>
            <Route path="/workspace" element={<InterviewWorkspace />} />
            <Route path="/candidates/:id/evaluate" element={<InterviewEvaluation />} />
          </Route>

          <Route element={<RoleRoute allowedRoles={['HR_ADMIN']} />}>
            <Route path="/analytics" element={<Analytics />} />
          </Route>

        </Route>
      </Route>
      
      {/* Catch All */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
