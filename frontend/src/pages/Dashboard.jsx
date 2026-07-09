import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import PageHeader from '../components/common/PageHeader';
import Can from '../components/Can';
import { useAuth } from '../contexts/AuthContext';
import { PERMISSIONS } from '../utils/permissions';
import CandidateStatsWidget from '../components/dashboard/CandidateStatsWidget';
import ReceptionQueueWidget from '../components/dashboard/ReceptionQueueWidget';
import HrReviewQueueWidget from '../components/dashboard/HrReviewQueueWidget';
import InterviewerQueueWidget from '../components/dashboard/InterviewerQueueWidget';
import FinalDecisionWidget from '../components/dashboard/FinalDecisionWidget';
import UserManagementCard from '../components/dashboard/UserManagementCard';

// A SINGLE uniform dashboard for every role. The visible modules are gated
// purely by permission codes via <Can> — no role-name branching.
const Dashboard = () => {
  const { user, permissions } = useAuth();

  const firstName = user?.name?.split(' ')[0] || user?.first_name || 'there';

  // Modules that gate on real permissions. If a user has none of them, show a
  // friendly empty state rather than a blank page.
  const gatedCodes = [
    PERMISSIONS.CANDIDATE_LIST,
    PERMISSIONS.WORKFLOW_RECEPTION_FORWARD,
    PERMISSIONS.WORKFLOW_HR_REVIEW,
    PERMISSIONS.WORKFLOW_TECHNICAL_EVALUATE,
    PERMISSIONS.EVALUATION_VIEW_ASSIGNED,
    PERMISSIONS.EVALUATION_VIEW_ALL,
    PERMISSIONS.DECISION_FINAL,
    PERMISSIONS.USER_MANAGE,
  ];
  const hasAnyModule = gatedCodes.some((code) => permissions.includes(code));

  return (
    <Box className="animate-fade-in" sx={{ pb: 6 }}>
      <PageHeader title={`Welcome back, ${firstName}!`} subtitle="Here's your dashboard overview" />

      {/* Candidate stats — anyone who can list candidates */}
      <Can permission={PERMISSIONS.CANDIDATE_LIST}>
        <CandidateStatsWidget />
      </Can>

      {/* Reception "forward to HR" queue */}
      <Can permission={PERMISSIONS.WORKFLOW_RECEPTION_FORWARD}>
        <Box sx={{ mb: 4 }}>
          <ReceptionQueueWidget />
        </Box>
      </Can>

      {/* HR review queue */}
      <Can permission={PERMISSIONS.WORKFLOW_HR_REVIEW}>
        <Box sx={{ mb: 4 }}>
          <HrReviewQueueWidget />
        </Box>
      </Can>

      {/* Interviewer "my assigned rounds" */}
      <Can anyOf={[PERMISSIONS.WORKFLOW_TECHNICAL_EVALUATE, PERMISSIONS.EVALUATION_VIEW_ASSIGNED]}>
        <Box sx={{ mb: 4 }}>
          <InterviewerQueueWidget />
        </Box>
      </Can>

      {/* Final-decision / full analytics */}
      <Can anyOf={[PERMISSIONS.EVALUATION_VIEW_ALL, PERMISSIONS.DECISION_FINAL]}>
        <Box sx={{ mb: 4 }}>
          <FinalDecisionWidget />
        </Box>
      </Can>

      {/* User management */}
      <Can permission={PERMISSIONS.USER_MANAGE}>
        <Box sx={{ mb: 4 }}>
          <UserManagementCard />
        </Box>
      </Can>

      {!hasAnyModule && (
        <Paper elevation={0} sx={{ p: 6, textAlign: 'center', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e3a5f', mb: 1 }}>
            Nothing to show yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            You don't have any dashboard modules assigned. Contact your administrator if you believe this is a mistake.
          </Typography>
        </Paper>
      )}
    </Box>
  );
};

export default Dashboard;
