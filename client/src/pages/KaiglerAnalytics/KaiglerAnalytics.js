import React from 'react';
import { Box, Typography, Card, CardContent, Grid, Chip, Avatar } from '@mui/material';
import { motion } from 'framer-motion';
import { BarChart, CheckCircle, Autorenew, Mail, Speed } from '@mui/icons-material';

const kpiData = {
  capitalEquipment: {
    title: 'Capital Equipment Agent',
    icon: <Autorenew color="primary" />,
    description: 'Automates the reconciliation of financial and property data between Sunflower, Compass, and CBOR systems.',
    kpis: [
      { name: 'Time Saved (est.)', value: '1040+ hrs/yr', color: 'success' },
      { name: 'FSA Rejection Rate', value: 'Target: < 5%', color: 'primary' },
      { name: 'Data Accuracy', value: 'Target: 99.5%', color: 'primary' },
    ],
    agentTasks: [
      'Monitor Sunflower for new assets',
      'Query CBOR for Line of Accounting (LOA)',
      'Request LOA from WCF team for WCF assets',
      'Enter LOA into Compass to prevent rejections',
    ],
  },
  realProperty: {
    title: 'Real Property Agent',
    icon: <BarChart color="primary" />,
    description: 'Automates the lifecycle management of real property assets, from construction to building status.',
    kpis: [
      { name: 'Time Saved (est.)', value: '384+ hrs/yr', color: 'success' },
      { name: 'Missed Commitments', value: 'Target: 0', color: 'primary' },
      { name: 'Survey Response Rate', value: 'Target: 95%', color: 'primary' },
    ],
    agentTasks: [
      'Monitor Status of Funds (SOF) reports',
      'Track payments in CBOR and create assets in Compass',
      'Process \"substantially completed\" reports from OMS',
      'Automate yearly facility survey distribution and reminders',
    ],
  },
  capitalSoftware: {
    title: 'Capital Software Agent',
    icon: <Speed color="primary" />,
    description: 'Uses the CPIC system as a single source of truth to automate the tracking of capitalized software projects.',
    kpis: [
      { name: 'Capitalization Accuracy', value: 'Target: 98%', color: 'primary' },
      { name: 'Time to Production', value: 'Reduce by 15%', color: 'primary' },
      { name: 'Manual Interventions', value: 'Reduce by 80%', color: 'success' },
    ],
    agentTasks: [
      'Monitor CPIC for projects meeting capitalization threshold',
      'Track development expenditures and project status',
      'Notify teams when software transitions to production',
      'Automatically calculate and apply overhead rates',
    ],
  },
  contractorHeld: {
    title: 'Contractor-Held Property Agent',
    icon: <Mail color="primary" />,
    description: 'Streamlines the yearly survey and reconciliation process for contractor-held assets.',
    kpis: [
      { name: 'Survey Completion Time', value: 'Reduce by 50%', color: 'primary' },
      { name: 'Year-End Adjustment Errors', value: 'Reduce by 90%', color: 'success' },
    ],
    agentTasks: [
      'Automate distribution of yearly surveys to contractors',
      'Send automated reminders for missing surveys',
      'Aggregate survey data for financial adjustments',
    ],
  },
};

const AgentCard = ({ agent }) => (
  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flexGrow: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.light', mr: 2 }}>{agent.icon}</Avatar>
          <Typography variant="h6" component="div">{agent.title}</Typography>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {agent.description}
        </Typography>
        
        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Key Performance Indicators:</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {agent.kpis.map(kpi => (
            <Chip key={kpi.name} label={`${kpi.name}: ${kpi.value}`} color={kpi.color} variant="outlined" size="small" />
          ))}
        </Box>

        <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Agent Tasks:</Typography>
        <Box>
          {agent.agentTasks.map(task => (
            <Box key={task} sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <CheckCircle color="success" sx={{ fontSize: 16, mr: 1 }} />
              <Typography variant="body2">{task}</Typography>
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  </motion.div>
);

const KaiglerAnalytics = () => {
  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Kaigler Analytics: Agentic Process Automation
      </Typography>
      <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 4 }}>
        Analysis of manual workflows and proposed agentic solutions based on the automation proposals by Brandi Kaigler.
      </Typography>

      <Grid container spacing={3}>
        {Object.values(kpiData).map(agent => (
          <Grid item xs={12} md={6} key={agent.title}>
            <AgentCard agent={agent} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default KaiglerAnalytics;
