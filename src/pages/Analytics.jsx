import React from 'react';
import { Box, Typography, Grid, Paper, Select, MenuItem, FormControl } from '@mui/material';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';

const funnelData = [
  { name: 'Applied', value: 4000 },
  { name: 'HR Screen', value: 3000 },
  { name: 'Tech Round', value: 1500 },
  { name: 'Final Round', value: 800 },
  { name: 'Offered', value: 200 },
  { name: 'Hired', value: 150 },
];

const trendData = [
  { month: 'Jan', hires: 65, interviews: 120 },
  { month: 'Feb', hires: 59, interviews: 150 },
  { month: 'Mar', hires: 80, interviews: 200 },
  { month: 'Apr', hires: 81, interviews: 180 },
  { month: 'May', hires: 120, interviews: 250 },
  { month: 'Jun', hires: 150, interviews: 300 },
];

const sourceData = [
  { name: 'LinkedIn', value: 400 },
  { name: 'Referral', value: 300 },
  { name: 'Indeed', value: 300 },
  { name: 'Company Site', value: 200 },
];

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'];

const Analytics = () => {
  return (
    <Box className="animate-fade-in" sx={{ pb: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800">Recruitment Analytics Overview</Typography>
        <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'background.paper' }}>
          <Select defaultValue="YTD">
            <MenuItem value="YTD">Year to Date</MenuItem>
            <MenuItem value="Q1">Q1 2026</MenuItem>
            <MenuItem value="Q2">Q2 2026</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Grid container spacing={4}>
        {/* Hiring Funnel */}
        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: 1, borderColor: 'divider', height: 400 }}>
            <Typography variant="h6" fontWeight="800" mb={3}>Hiring Funnel Conversion</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <BarChart data={funnelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{ fill: '#F3F4F6' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#4F46E5" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Candidate Sources */}
        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: 1, borderColor: 'divider', height: 400 }}>
            <Typography variant="h6" fontWeight="800" mb={3}>Candidate Sources</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={5} dataKey="value">
                  {sourceData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </Pie>
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Monthly Hiring Trends */}
        <Grid item xs={12}>
          <Paper elevation={0} sx={{ p: 4, borderRadius: 4, border: 1, borderColor: 'divider', height: 400 }}>
            <Typography variant="h6" fontWeight="800" mb={3}>Hiring vs Interviews Scheduled (Monthly Trend)</Typography>
            <ResponsiveContainer width="100%" height="85%">
              <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorInterviews" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Area type="monotone" dataKey="interviews" stroke="#4F46E5" fillOpacity={1} fill="url(#colorInterviews)" />
                <Area type="monotone" dataKey="hires" stroke="#10B981" fillOpacity={1} fill="url(#colorHires)" />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
