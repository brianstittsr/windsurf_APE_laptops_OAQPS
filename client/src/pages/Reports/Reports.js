import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Alert,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Download as DownloadIcon,
  Email as EmailIcon,
  Visibility as ViewIcon,
  Delete as DeleteIcon,
  Assessment as ReportIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from 'react-query';
// Date picker functionality removed for demo - using regular text inputs
import toast from 'react-hot-toast';
import localStorageService from '../../services/localStorageService';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Reports = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const [reportForm, setReportForm] = useState({
    title: '',
    format: 'pdf',
    fiscalYear: '',
    schema: '',
    startDate: null,
    endDate: null,
    sections: ['summary', 'details', 'analytics'],
    includeCharts: true,
  });
  const [emailForm, setEmailForm] = useState({
    recipients: '',
    subject: '',
    message: '',
    includeAttachment: true,
  });

  const queryClient = useQueryClient();

  // Generate report content function
  const generateReportContent = (reportData, invoices, analytics) => {
    const content = {
      title: reportData.title,
      generatedAt: new Date().toISOString(),
      summary: {
        totalContracts: invoices.length,
        totalValue: invoices.reduce((sum, inv) => sum + inv.totalAwardAmount, 0),
        averageValue: invoices.length ? invoices.reduce((sum, inv) => sum + inv.totalAwardAmount, 0) / invoices.length : 0,
        fiscalYears: [...new Set(invoices.map(inv => inv.fiscalYear))].sort()
      },
      sections: {}
    };

    if (reportData.sections.includes('summary')) {
      content.sections.summary = {
        overview: `This report covers ${invoices.length} contracts with a total value of $${content.summary.totalValue.toLocaleString()}.`,
        keyMetrics: {
          totalContracts: invoices.length,
          totalValue: content.summary.totalValue,
          averageValue: content.summary.averageValue,
          fiscalYears: content.summary.fiscalYears.length
        }
      };
    }

    if (reportData.sections.includes('details')) {
      content.sections.details = {
        contracts: invoices.map(inv => ({
          contractNumber: inv.contractNumber,
          vendorName: inv.vendorName,
          totalAmount: inv.totalAwardAmount,
          fiscalYear: inv.fiscalYear,
          description: inv.description
        }))
      };
    }

    if (reportData.sections.includes('analytics')) {
      const vendorAnalysis = {};
      invoices.forEach(inv => {
        if (!vendorAnalysis[inv.vendorName]) {
          vendorAnalysis[inv.vendorName] = { count: 0, value: 0 };
        }
        vendorAnalysis[inv.vendorName].count++;
        vendorAnalysis[inv.vendorName].value += inv.totalAwardAmount;
      });

      content.sections.analytics = {
        vendorAnalysis: Object.entries(vendorAnalysis).map(([vendor, data]) => ({
          vendor,
          contracts: data.count,
          totalValue: data.value,
          percentage: ((data.value / content.summary.totalValue) * 100).toFixed(1)
        })).sort((a, b) => b.totalValue - a.totalValue),
        fiscalYearBreakdown: analytics.byFiscalYear
      };
    }

    return content;
  };

  // Fetch report templates
  const { data: templates } = useQuery(
    'report-templates',
    () => {
      return [
        { id: 'summary', name: 'Executive Summary', description: 'High-level overview of contract data', sections: ['summary', 'analytics'] },
        { id: 'detailed', name: 'Detailed Analysis', description: 'Comprehensive contract analysis', sections: ['summary', 'details', 'analytics'] },
        { id: 'financial', name: 'Financial Report', description: 'Financial breakdown and trends', sections: ['summary', 'analytics', 'trends'] },
        { id: 'vendor', name: 'Vendor Analysis', description: 'Vendor performance and distribution', sections: ['summary', 'analytics'] },
        { id: 'compliance', name: 'Compliance Report', description: 'Regulatory compliance overview', sections: ['summary', 'details'] }
      ];
    }
  );

  // Fetch report history from localStorage
  const { data: reportHistory, refetch: refetchHistory } = useQuery(
    'report-history',
    () => {
      return localStorageService.getReports();
    }
  );

  // Generate report mutation
  const generateReportMutation = useMutation(
    async (reportData) => {
      const invoices = localStorageService.getInvoices();
      const analytics = localStorageService.generateAnalytics();
      
      // Filter invoices based on report criteria
      let filteredInvoices = invoices;
      if (reportData.fiscalYear) {
        filteredInvoices = invoices.filter(inv => inv.fiscalYear.toString() === reportData.fiscalYear);
      }
      if (reportData.schema) {
        filteredInvoices = invoices.filter(inv => inv.schema === reportData.schema);
      }
      
      // Generate report content
      const reportContent = generateReportContent(reportData, filteredInvoices, analytics);
      
      // Create report record
      const report = {
        title: reportData.title,
        format: reportData.format,
        content: reportContent,
        criteria: {
          fiscalYear: reportData.fiscalYear,
          schema: reportData.schema,
          sections: reportData.sections
        },
        summary: {
          totalContracts: filteredInvoices.length,
          totalValue: filteredInvoices.reduce((sum, inv) => sum + inv.totalAwardAmount, 0),
          dateRange: {
            from: reportData.startDate,
            to: reportData.endDate
          }
        }
      };
      
      return localStorageService.addReport(report);
    },
    {
      onSuccess: (data) => {
        toast.success('Report generated successfully!');
        setCreateDialogOpen(false);
        refetchHistory();
        resetReportForm();
      },
      onError: (error) => {
        toast.error('Failed to generate report');
        console.error('Report generation error:', error);
      },
    }
  );

  // Send email mutation
  const sendEmailMutation = useMutation(
    async (emailData) => {
      // Simulate email sending - in real app this would call actual email service
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Log the email activity
      localStorageService.logActivity({
        action: 'Report Email Sent',
        description: `Sent report "${selectedReport?.title}" to ${emailData.recipients}`,
        user: 'user'
      });
      
      return { success: true, message: 'Report sent successfully' };
    },
    {
      onSuccess: (data) => {
        toast.success(data.message);
        setEmailDialogOpen(false);
        setSelectedReport(null);
        resetEmailForm();
      },
      onError: () => {
        toast.error('Failed to send report');
      },
    }
  );

  const resetReportForm = () => {
    setReportForm({
      title: '',
      format: 'pdf',
      fiscalYear: '',
      schema: '',
      startDate: null,
      endDate: null,
      sections: ['summary', 'details', 'analytics'],
      includeCharts: true,
    });
  };

  const handleDownloadReport = (report) => {
    try {
      const filename = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.${report.format}`;

      if (report.format === 'pdf') {
        const doc = new jsPDF();
        autoTable(doc);
        doc.text(report.title, 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date(report.generatedAt).toLocaleString()}`, 14, 26);

        let y = 40;

        if (report.content.sections.summary) {
          doc.setFontSize(12);
          doc.text('EXECUTIVE SUMMARY', 14, y);
          y += 8;
          doc.setFontSize(10);
          doc.text(report.content.sections.summary.overview, 14, y);
          y += 10;

          doc.autoTable({
            startY: y,
            head: [['Metric', 'Value']],
            body: [
              ['Total Contracts', report.content.sections.summary.keyMetrics.totalContracts],
              ['Total Value', `$${report.content.sections.summary.keyMetrics.totalValue.toLocaleString()}`],
              ['Average Value', `$${report.content.sections.summary.keyMetrics.averageValue.toLocaleString()}`],
              ['Fiscal Years', report.content.sections.summary.keyMetrics.fiscalYears],
            ],
          });
          y = doc.autoTable.previous.finalY + 10;
        }

        if (report.content.sections.analytics && report.content.sections.analytics.vendorAnalysis) {
          doc.setFontSize(12);
          doc.text('VENDOR ANALYSIS', 14, y);
          y += 8;
          doc.autoTable({
            startY: y,
            head: [['Vendor', 'Contracts', 'Total Value', 'Percentage']],
            body: report.content.sections.analytics.vendorAnalysis.map(v => [
              v.vendor,
              v.contracts,
              `$${v.totalValue.toLocaleString()}`,
              `${v.percentage}%`
            ]),
          });
          y = doc.autoTable.previous.finalY + 10;
        }

        if (report.content.sections.details && report.content.sections.details.contracts) {
          doc.setFontSize(12);
          doc.text('CONTRACT DETAILS', 14, y);
          y += 8;
          doc.autoTable({
            startY: y,
            head: [['Contract Number', 'Vendor', 'Amount', 'FY']],
            body: report.content.sections.details.contracts.map(c => [
              c.contractNumber,
              c.vendorName,
              `$${c.totalAmount.toLocaleString()}`,
              c.fiscalYear
            ]),
          });
        }

        doc.save(filename);

      } else {
        let content = '';
        if (report.format === 'json') {
          content = JSON.stringify(report.content, null, 2);
        } else if (report.format === 'csv') {
          if (report.content.sections.details && report.content.sections.details.contracts) {
            const contracts = report.content.sections.details.contracts;
            const headers = ['Contract Number', 'Vendor Name', 'Total Amount', 'Fiscal Year', 'Description'];
            const csvRows = [
              headers.join(','),
              ...contracts.map(contract => [
                contract.contractNumber,
                `"${contract.vendorName}"`,
                contract.totalAmount,
                contract.fiscalYear,
                `"${contract.description || ''}"`
              ].join(','))
            ];
            content = csvRows.join('\n');
          } else {
            content = 'No contract details available for CSV export';
          }
        }

        const blob = new Blob([content], { 
          type: report.format === 'json' ? 'application/json' : 'text/csv'
        });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }

      toast.success('Report downloaded successfully!');
      localStorageService.logActivity({
        action: 'Report Download',
        description: `Downloaded report: ${report.title}`,
        user: 'user'
      });

    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download report');
    }
  };


  const resetEmailForm = () => {
    setEmailForm({
      recipients: '',
      subject: '',
      message: '',
      includeAttachment: true,
    });
  };

  const handleCreateReport = () => {
    if (!reportForm.title.trim()) {
      toast.error('Please enter a report title');
      return;
    }

    const filters = {};
    if (reportForm.fiscalYear) filters.fiscalYear = parseInt(reportForm.fiscalYear);
    if (reportForm.schema) filters.schema = reportForm.schema;
    if (reportForm.startDate) filters.startDate = reportForm.startDate.toISOString();
    if (reportForm.endDate) filters.endDate = reportForm.endDate.toISOString();

    generateReportMutation.mutate({
      ...reportForm,
      ...filters,
    });
  };

  const handleSendEmail = () => {
    if (!emailForm.recipients.trim()) {
      toast.error('Please enter recipient email addresses');
      return;
    }

    const recipients = emailForm.recipients.split(',').map(email => email.trim());

    sendEmailMutation.mutate({
      reportId: selectedReport.id,
      recipients: recipients,
      subject: emailForm.subject || `Report: ${selectedReport.title}`,
      message: emailForm.message,
      format: selectedReport.format,
      includeAttachment: emailForm.includeAttachment,
    });
  };

  const handleUseTemplate = (template) => {
    setReportForm({
      ...reportForm,
      title: template.name,
      sections: template.sections,
      ...template.defaultFilters,
    });
    setCreateDialogOpen(true);
  };

  const handleSectionChange = (section, checked) => {
    setReportForm(prev => ({
      ...prev,
      sections: checked
        ? [...prev.sections, section]
        : prev.sections.filter(s => s !== section)
    }));
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'generated': return 'success';
      case 'processing': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
            Reports
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setCreateDialogOpen(true)}
          >
            Create Report
          </Button>
        </Box>

        {/* Report Templates */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report Templates
            </Typography>
            <Grid container spacing={2}>
              {templates?.map((template) => (
                <Grid item xs={12} sm={6} md={4} key={template.id}>
                  <motion.div whileHover={{ scale: 1.02 }}>
                    <Card variant="outlined" sx={{ cursor: 'pointer' }}>
                      <CardContent onClick={() => handleUseTemplate(template)}>
                        <Typography variant="h6" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {template.sections.map((section) => (
                            <Chip
                              key={section}
                              label={section.replace('_', ' ')}
                              size="small"
                              color="primary"
                              variant="outlined"
                            />
                          ))}
                        </Box>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>

        {/* Report History */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Report History
            </Typography>
            
            {reportHistory && reportHistory.length > 0 ? (
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Format</TableCell>
                      <TableCell>Generated</TableCell>
                      <TableCell>Invoices</TableCell>
                      <TableCell>Total Value</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {reportHistory.map((report) => (
                      <TableRow key={report.id} hover>
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 500 }}>
                            {report.title}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={report.format.toUpperCase()}
                            size="small"
                            color="primary"
                          />
                        </TableCell>
                        <TableCell>{formatDate(report.generatedAt)}</TableCell>
                        <TableCell>{report.invoicesIncluded}</TableCell>
                        <TableCell>${report.totalValue?.toLocaleString() || '0'}</TableCell>
                        <TableCell>
                          <Chip
                            label={report.status}
                            size="small"
                            color={getStatusColor(report.status)}
                          />
                        </TableCell>
                        <TableCell align="center">
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Tooltip title="Download">
                              <IconButton
                                size="small"
                                color="primary"
                                onClick={() => handleDownloadReport(report)}
                              >
                                <DownloadIcon />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Send Email">
                              <IconButton
                                size="small"
                                color="secondary"
                                onClick={() => {
                                  setSelectedReport(report);
                                  setEmailDialogOpen(true);
                                }}
                              >
                                <EmailIcon />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">
                No reports generated yet. Create your first report using the templates above.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Create Report Dialog */}
        <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Create Custom Report</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Report Title"
                    value={reportForm.title}
                    onChange={(e) => setReportForm(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter report title..."
                  />
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Format</InputLabel>
                    <Select
                      value={reportForm.format}
                      label="Format"
                      onChange={(e) => setReportForm(prev => ({ ...prev, format: e.target.value }))}
                    >
                      <MenuItem value="pdf">PDF</MenuItem>
                      <MenuItem value="excel">Excel</MenuItem>
                      <MenuItem value="csv">CSV</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Fiscal Year"
                    value={reportForm.fiscalYear}
                    onChange={(e) => setReportForm(prev => ({ ...prev, fiscalYear: e.target.value }))}
                    placeholder="e.g., 2024"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Schema</InputLabel>
                    <Select
                      value={reportForm.schema}
                      label="Schema"
                      onChange={(e) => setReportForm(prev => ({ ...prev, schema: e.target.value }))}
                    >
                      <MenuItem value="">All Schemas</MenuItem>
                      <MenuItem value="epa_laptop_contract">EPA Laptop Contract</MenuItem>
                      <MenuItem value="generic_invoice">Generic Invoice</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Start Date"
                    type="date"
                    value={reportForm.startDate ? reportForm.startDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setReportForm(prev => ({ ...prev, startDate: e.target.value ? new Date(e.target.value) : null }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="End Date"
                    type="date"
                    value={reportForm.endDate ? reportForm.endDate.toISOString().split('T')[0] : ''}
                    onChange={(e) => setReportForm(prev => ({ ...prev, endDate: e.target.value ? new Date(e.target.value) : null }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle2" gutterBottom>
                    Report Sections
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {['summary', 'details', 'analytics', 'trends', 'locations', 'products'].map((section) => (
                      <FormControlLabel
                        key={section}
                        control={
                          <Checkbox
                            checked={reportForm.sections.includes(section)}
                            onChange={(e) => handleSectionChange(section, e.target.checked)}
                          />
                        }
                        label={section.charAt(0).toUpperCase() + section.slice(1)}
                      />
                    ))}
                  </Box>
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={reportForm.includeCharts}
                        onChange={(e) => setReportForm(prev => ({ ...prev, includeCharts: e.target.checked }))}
                      />
                    }
                    label="Include Charts and Visualizations"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleCreateReport}
              disabled={generateReportMutation.isLoading}
              startIcon={generateReportMutation.isLoading ? null : <ReportIcon />}
            >
              {generateReportMutation.isLoading ? 'Generating...' : 'Generate Report'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Email Dialog */}
        <Dialog open={emailDialogOpen} onClose={() => setEmailDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Send Report via Email</DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recipients"
                    value={emailForm.recipients}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, recipients: e.target.value }))}
                    placeholder="email1@example.com, email2@example.com"
                    helperText="Separate multiple email addresses with commas"
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Subject"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, subject: e.target.value }))}
                    placeholder={selectedReport ? `Report: ${selectedReport.title}` : 'Report Subject'}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={4}
                    label="Message"
                    value={emailForm.message}
                    onChange={(e) => setEmailForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Optional message to include with the report..."
                  />
                </Grid>

                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={emailForm.includeAttachment}
                        onChange={(e) => setEmailForm(prev => ({ ...prev, includeAttachment: e.target.checked }))}
                      />
                    }
                    label="Include report as attachment"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setEmailDialogOpen(false)}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSendEmail}
              disabled={sendEmailMutation.isLoading}
              startIcon={sendEmailMutation.isLoading ? null : <EmailIcon />}
            >
              {sendEmailMutation.isLoading ? 'Sending...' : 'Send Email'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

export default Reports;
