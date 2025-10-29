import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  LinearProgress,
  Alert,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { queryAirnowApi } from '../../services/airnowService';
import localStorageService from '../../services/localStorageService';

const majorCities = [
  { name: 'Raleigh, NC', zip: '27601' },
  { name: 'New York, NY', zip: '10001' },
  { name: 'Los Angeles, CA', zip: '90001' },
  { name: 'Chicago, IL', zip: '60601' },
  { name: 'Houston, TX', zip: '77001' },
  { name: 'Phoenix, AZ', zip: '85001' },
];

const Reports = () => {
  const [airnowApiKey, setAirnowApiKey] = useState(() => {
    const settings = localStorageService.getSettings();
    return settings.dataApiKeys?.airnow || '';
  });
  const [reports, setReports] = useState([]);

  const { data: citiesData, isLoading: isLoadingCities } = useQuery(
    'allCitiesAqiForReports',
    async () => {
      const promises = majorCities.map(city => 
        queryAirnowApi(city.zip, airnowApiKey).catch(() => null)
      );
      const results = await Promise.all(promises);
      return results.filter(Boolean).map(r => r[0]);
    },
    { enabled: !!airnowApiKey }
  );

  const generateReportMutation = useMutation(
    () => {
      if (!citiesData || citiesData.length === 0) {
        throw new Error('AirNow data is not available to generate a report.');
      }
      const newReport = {
        id: `report-${Date.now()}`,
        title: `National Air Quality Summary - ${new Date().toLocaleDateString()}`,
        generatedAt: new Date(),
        data: citiesData,
      };
      setReports(prev => [newReport, ...prev]);
      return newReport;
    },
    {
      onSuccess: () => toast.success('Report generated successfully!'),
      onError: (error) => toast.error(error.message),
    }
  );

  const handleDownloadReport = (report) => {
    const doc = new jsPDF();
    doc.text(report.title, 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${report.generatedAt.toLocaleString()}`, 14, 26);

    const tableData = report.data.filter(Boolean).map(city => [
      city.ReportingArea || 'N/A',
      city.AQI || 'N/A',
      city.Category?.Name || 'N/A',
    ]);

    doc.autoTable({
      startY: 35,
      head: [['City', 'AQI', 'Category']],
      body: tableData,
    });

    doc.save(`${report.title.replace(/ /g, '_')}.pdf`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
          AirNow Reports
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => generateReportMutation.mutate()}
          disabled={!airnowApiKey || isLoadingCities || generateReportMutation.isLoading}
        >
          {generateReportMutation.isLoading ? 'Generating...' : 'Generate National Summary'}
        </Button>
      </Box>

      {!airnowApiKey && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          The AirNow API key is not set. Data cannot be fetched to generate reports. Please set the API key in the Settings page.
        </Alert>
      )}

      {isLoadingCities && <LinearProgress />}

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Report History
          </Typography>
          {reports.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Report Title</TableCell>
                    <TableCell>Generated At</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell>{report.title}</TableCell>
                      <TableCell>{report.generatedAt.toLocaleString()}</TableCell>
                      <TableCell align="center">
                        <Tooltip title="Download PDF">
                          <IconButton onClick={() => handleDownloadReport(report)}>
                            <DownloadIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No reports generated yet. Click the button above to create one.</Alert>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Reports;
