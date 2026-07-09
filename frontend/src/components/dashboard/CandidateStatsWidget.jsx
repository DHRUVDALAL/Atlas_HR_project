import React, { useState, useEffect } from 'react';
import { Grid, Box, CircularProgress } from '@mui/material';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import MoveToInboxOutlinedIcon from '@mui/icons-material/MoveToInboxOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import StatCard from '../common/StatCard';
import { getApplicants } from '../../api/applicantService';

// Status the intake form writes on submit (before a receptionist forwards).
const SUBMITTED_STATUS = 'Submitted — awaiting reception';

// High-level candidate funnel. Each figure is the REAL total for that status —
// read from the API's `total` field (a status-filtered query), never from the
// length of one paginated page.
const CandidateStatsWidget = () => {
  const [counts, setCounts] = useState(null);

  useEffect(() => {
    const countFor = async (params) => {
      // limit=1: we only need the `total`, not the rows.
      const res = await getApplicants({ ...params, limit: 1 });
      return res.total || 0;
    };
    (async () => {
      try {
        const [total, awaitingReception, awaitingHr, selected] =
          await Promise.all([
            countFor({}),
            countFor({ status: SUBMITTED_STATUS }),
            countFor({ status: 'RECEPTION_FORWARDED' }),
            countFor({ status: 'SELECTED' }),
          ]);
        setCounts({ total, awaitingReception, awaitingHr, selected });
      } catch (err) {
        console.error('Error fetching candidate stats:', err);
        setCounts({ total: 0, awaitingReception: 0, awaitingHr: 0, selected: 0 });
      }
    })();
  }, []);

  if (!counts) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title="Total Candidates" value={counts.total} icon={<PeopleOutlinedIcon />} color="#1E3A5F" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title="Awaiting Reception" value={counts.awaitingReception} icon={<MoveToInboxOutlinedIcon />} color="#7B1FA2" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title="Awaiting HR Review" value={counts.awaitingHr} icon={<HourglassEmptyOutlinedIcon />} color="#00897B" />
      </Grid>
      <Grid size={{ xs: 12, sm: 6, md: 3 }}>
        <StatCard title="Selected Candidates" value={counts.selected} icon={<CheckCircleOutlineIcon />} color="#E65100" />
      </Grid>
    </Grid>
  );
};

export default CandidateStatsWidget;
