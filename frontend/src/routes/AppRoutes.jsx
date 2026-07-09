import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Login';
import DashboardLayout from '../layouts/DashboardLayout';
import ProtectedRoute from './ProtectedRoute';
import RequirePermission from './RequirePermission';
import CandidateForm from '../pages/CandidateForm';
import LandingPage from '../pages/LandingPage';
import { PERMISSIONS } from '../utils/permissions';

// One uniform dashboard for every role.
import Dashboard from '../pages/Dashboard';

// Permission-gated detail/work pages.
import EditCandidatesList from '../pages/EditCandidatesList';
import HrReviewForm from '../pages/HrReviewForm';
import InterviewerEvalForm from '../pages/InterviewerEvalForm';
import AdminCandidateReview from '../pages/AdminCandidateReview';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes — unchanged (candidate registration MUST stay public) */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register-candidate" element={<CandidateForm />} />

      {/* Authenticated Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          {/* Single shared dashboard — content is permission-gated inside */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Candidate list / edit */}
          <Route element={<RequirePermission permission={PERMISSIONS.CANDIDATE_LIST} />}>
            <Route path="/candidates" element={<EditCandidatesList />} />
          </Route>

          {/* HR review */}
          <Route element={<RequirePermission permission={PERMISSIONS.WORKFLOW_HR_REVIEW} />}>
            <Route path="/hr/review/:id" element={<HrReviewForm />} />
          </Route>

          {/* Interviewer technical evaluation */}
          <Route element={<RequirePermission permission={PERMISSIONS.WORKFLOW_TECHNICAL_EVALUATE} />}>
            <Route path="/interviewer/evaluate/:id" element={<InterviewerEvalForm />} />
          </Route>

          {/* Admin candidate review + final decision */}
          <Route element={<RequirePermission anyOf={[PERMISSIONS.EVALUATION_VIEW_ALL, PERMISSIONS.DECISION_FINAL]} />}>
            <Route path="/admin/review/:id" element={<AdminCandidateReview />} />
          </Route>
        </Route>
      </Route>

      {/* Catch All */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;
