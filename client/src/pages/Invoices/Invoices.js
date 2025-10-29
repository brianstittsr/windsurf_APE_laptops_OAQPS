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
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  InputAdornment,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Download as DownloadIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Description as FileIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useQuery } from 'react-query';
import toast from 'react-hot-toast';
import localStorageService from '../../services/localStorageService';

const Invoices = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [pdfDialogOpen, setPdfDialogOpen] = useState(false);
  const [filterYear, setFilterYear] = useState('all');

  // Fetch invoices from localStorage
  const { data: invoices, isLoading } = useQuery(
    'all-invoices',
    () => {
      return localStorageService.getInvoices();
    },
    {
      refetchInterval: 5000,
    }
  );

  // Filter invoices based on search and year
  const filteredInvoices = React.useMemo(() => {
    if (!invoices) return [];
    
    return invoices.filter(invoice => {
      const matchesSearch = searchTerm === '' || 
        invoice.contractNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.description?.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesYear = filterYear === 'all' || invoice.fiscalYear === parseInt(filterYear);
      
      return matchesSearch && matchesYear;
    }).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  }, [invoices, searchTerm, filterYear]);

  // Get unique fiscal years for filter
  const fiscalYears = React.useMemo(() => {
    if (!invoices) return [];
    return [...new Set(invoices.map(inv => inv.fiscalYear))].sort((a, b) => b - a);
  }, [invoices]);

  const handleViewPDF = (invoice) => {
    setSelectedInvoice(invoice);
    setPdfDialogOpen(true);
    
    // Log activity
    localStorageService.logActivity({
      action: 'View Invoice PDF',
      description: `Viewed PDF for contract ${invoice.contractNumber}`,
      user: 'user'
    });
  };

  const handleClosePDF = () => {
    setPdfDialogOpen(false);
    setSelectedInvoice(null);
  };

  const handleDownloadPDF = (invoice) => {
    // In a real scenario, this would download the PDF
    // For now, we'll open it in a new tab
    if (invoice.sourceFile) {
      const pdfUrl = `/api/pdfs/${encodeURIComponent(invoice.sourceFile)}`;
      window.open(pdfUrl, '_blank');
      
      toast.success(`Opening ${invoice.sourceFile}`);
      
      localStorageService.logActivity({
        action: 'Download Invoice PDF',
        description: `Downloaded PDF for contract ${invoice.contractNumber}`,
        user: 'user'
      });
    } else {
      toast.error('PDF file not available');
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          Invoice Documents
        </Typography>
        <LinearProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Invoice Documents
      </Typography>

      {/* Search and Filter Bar */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              placeholder="Search by contract number, vendor, or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 300 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
            
            <TextField
              select
              label="Fiscal Year"
              value={filterYear}
              onChange={(e) => setFilterYear(e.target.value)}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="all">All Years</option>
              {fiscalYears.map(year => (
                <option key={year} value={year}>FY {year}</option>
              ))}
            </TextField>

            <Chip 
              label={`${filteredInvoices.length} Invoice${filteredInvoices.length !== 1 ? 's' : ''}`}
              color="primary"
              variant="outlined"
            />
          </Box>
        </CardContent>
      </Card>

      {/* Invoices Table */}
      {filteredInvoices.length === 0 ? (
        <Card>
          <CardContent>
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <FileIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="textSecondary" gutterBottom>
                No invoices found
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {searchTerm || filterYear !== 'all' 
                  ? 'Try adjusting your search or filters'
                  : 'Upload your first invoice to get started'}
              </Typography>
            </Box>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: 'primary.main' }}>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Contract Number</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Vendor</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Amount</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Fiscal Year</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Upload Date</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ color: 'white', fontWeight: 'bold' }} align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.map((invoice, index) => (
                  <motion.tr
                    key={invoice.id}
                    component={TableRow}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'action.hover',
                      },
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {invoice.contractNumber || 'N/A'}
                      </Typography>
                      {invoice.sourceFile && (
                        <Typography variant="caption" color="textSecondary" sx={{ display: 'block' }}>
                          {invoice.sourceFile}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>{invoice.vendorName || 'Unknown'}</TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        {formatCurrency(invoice.totalAwardAmount || 0)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={`FY${invoice.fiscalYear}`} 
                        size="small" 
                        color="primary"
                        variant="outlined"
                      />
                    </TableCell>
                    <TableCell>{formatDate(invoice.uploadDate)}</TableCell>
                    <TableCell>
                      <Chip 
                        label={invoice.status || 'Active'} 
                        size="small" 
                        color="success"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View PDF">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewPDF(invoice)}
                          size="small"
                        >
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Download PDF">
                        <IconButton
                          color="secondary"
                          onClick={() => handleDownloadPDF(invoice)}
                          size="small"
                        >
                          <DownloadIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </motion.tr>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </motion.div>
      )}

      {/* PDF Viewer Dialog */}
      <Dialog
        open={pdfDialogOpen}
        onClose={handleClosePDF}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: { height: '90vh' }
        }}
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6">
                {selectedInvoice?.contractNumber || 'Invoice Document'}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                {selectedInvoice?.sourceFile}
              </Typography>
            </Box>
            <IconButton onClick={handleClosePDF} edge="end">
              <CloseIcon />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent dividers sx={{ p: 0, height: '100%' }}>
          {selectedInvoice?.sourceFile ? (
            <iframe
              src={`/api/pdfs/${encodeURIComponent(selectedInvoice.sourceFile)}`}
              title="PDF Viewer"
              width="100%"
              height="100%"
              style={{ border: 'none' }}
            />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Alert severity="warning">
                PDF file not available for this invoice
              </Alert>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => handleDownloadPDF(selectedInvoice)} startIcon={<DownloadIcon />}>
            Download
          </Button>
          <Button onClick={handleClosePDF}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Invoices;
