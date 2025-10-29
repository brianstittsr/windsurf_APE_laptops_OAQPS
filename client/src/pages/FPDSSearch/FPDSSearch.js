import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Tooltip,
  IconButton,
  Divider
} from '@mui/material';
import {
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  Info as InfoIcon,
  History as HistoryIcon,
  Clear as ClearIcon,
  FilterList as FilterIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useMutation } from 'react-query';
import toast from 'react-hot-toast';
import fpdsService from '../../services/fpdsService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ContractDetailsForm from '../../components/ContractDetailsForm/ContractDetailsForm';

const FPDSSearch = () => {
  const [searchCriteria, setSearchCriteria] = useState({
    contractingAgencyName: 'ENVIRONMENTAL PROTECTION AGENCY',
    vendorName: '',
    contractNumber: '',
    naicsCode: '',
    pscCode: '',
    signedDateFrom: '',
    signedDateTo: '',
    dollarAmountFrom: '',
    dollarAmountTo: '',
    placeOfPerformanceState: '',
    descriptionOfRequirement: '',
    maxRecords: 100
  });

  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState([]);
  const [schemaDialog, setSchemaDialog] = useState(false);
  const [historyDialog, setHistoryDialog] = useState(false);
  const [contractDetailsDialog, setContractDetailsDialog] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);
  const [expandedAccordions, setExpandedAccordions] = useState(['basic']);

  // Load search history on component mount
  useEffect(() => {
    setSearchHistory(fpdsService.getSearchHistory());
  }, []);

  // Search mutation
  const searchMutation = useMutation(
    async (criteria) => {
      const result = await fpdsService.searchContracts(criteria);
      return result;
    },
    {
      onSuccess: (data) => {
        setSearchResults(data.data || []);
        setSearchHistory(fpdsService.getSearchHistory());
        toast.success(`Found ${data.total} contracts`);
      },
      onError: (error) => {
        toast.error(`Search failed: ${error.message}`);
      }
    }
  );

  const handleSearch = () => {
    if (!searchCriteria.contractingAgencyName && !searchCriteria.vendorName && !searchCriteria.contractNumber) {
      toast.error('Please provide at least one search criteria');
      return;
    }
    searchMutation.mutate(searchCriteria);
  };

  const handleClearSearch = () => {
    setSearchCriteria({
      contractingAgencyName: 'ENVIRONMENTAL PROTECTION AGENCY',
      vendorName: '',
      contractNumber: '',
      naicsCode: '',
      pscCode: '',
      signedDateFrom: '',
      signedDateTo: '',
      dollarAmountFrom: '',
      dollarAmountTo: '',
      placeOfPerformanceState: '',
      descriptionOfRequirement: '',
      maxRecords: 100
    });
    setSearchResults([]);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    if (isExpanded) {
      setExpandedAccordions([...expandedAccordions, panel]);
    } else {
      setExpandedAccordions(expandedAccordions.filter(p => p !== panel));
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const exportResults = () => {
    if (searchResults.length === 0) {
      toast.error('No results to export');
      return;
    }

    const csvContent = [
      // CSV Headers
      ['Contract ID', 'Agency', 'Vendor', 'Amount', 'Signed Date', 'NAICS', 'PSC', 'Description'].join(','),
      // CSV Data
      ...searchResults.map(contract => [
        contract.piid || '',
        contract.contractingAgencyName || '',
        contract.vendorName || '',
        contract.dollarAmount || 0,
        contract.signedDate || '',
        contract.naicsCode || '',
        contract.pscCode || '',
        `"${(contract.descriptionOfRequirement || '').replace(/"/g, '""')}"`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fpds_search_results_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    toast.success('Results exported to CSV');
  };

  const loadHistorySearch = (historyItem) => {
    setSearchCriteria(historyItem.criteria);
    setSearchResults(historyItem.results);
    setHistoryDialog(false);
    toast.success('Search loaded from history');
  };

  const handleViewContractDetails = (contract) => {
    setSelectedContract(contract);
    setContractDetailsDialog(true);
  };

  const handleCloseContractDetails = () => {
    setContractDetailsDialog(false);
    setSelectedContract(null);
  };

  const generatePDFReport = () => {
    if (searchResults.length === 0) {
      toast.error('No results to generate a report');
      return;
    }

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text('FPDS Search Results', 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 26);

    const head = [['Contract ID', 'Agency', 'Vendor', 'Amount', 'Signed Date', 'NAICS']];
    const body = searchResults.map(c => [
      c.piid,
      c.contractingAgencyName,
      c.vendorName,
      formatCurrency(c.dollarAmount),
      formatDate(c.signedDate),
      c.naicsCode
    ]);

    doc.autoTable({
      startY: 35,
      head: head,
      body: body,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 160, 133] },
      margin: { top: 30 }
    });

    doc.save(`fpds_report_${new Date().toISOString().split('T')[0]}.pdf`);
    toast.success('PDF report generated successfully!');
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        FPDS Contract Search
      </Typography>

      <Typography variant="body1" color="textSecondary" sx={{ mb: 3 }}>
        Search the Federal Procurement Data System (FPDS) for government contract information
      </Typography>

      {/* Search Form */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Typography variant="h6">Search Criteria</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="View Search Schema">
                <IconButton onClick={() => setSchemaDialog(true)}>
                  <InfoIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Search History">
                <IconButton onClick={() => setHistoryDialog(true)}>
                  <HistoryIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Clear Search">
                <IconButton onClick={handleClearSearch}>
                  <ClearIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* Basic Search */}
          <Accordion 
            expanded={expandedAccordions.includes('basic')} 
            onChange={handleAccordionChange('basic')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Basic Search Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contracting Agency"
                    value={searchCriteria.contractingAgencyName}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, contractingAgencyName: e.target.value }))}
                    placeholder="e.g., ENVIRONMENTAL PROTECTION AGENCY"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Vendor Name"
                    value={searchCriteria.vendorName}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, vendorName: e.target.value }))}
                    placeholder="e.g., Dell Inc."
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Contract Number"
                    value={searchCriteria.contractNumber}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, contractNumber: e.target.value }))}
                    placeholder="e.g., 68HERD24F0034"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Max Records"
                    type="number"
                    value={searchCriteria.maxRecords}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, maxRecords: parseInt(e.target.value) || 100 }))}
                    inputProps={{ min: 1, max: 1000 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Classification Codes */}
          <Accordion 
            expanded={expandedAccordions.includes('codes')} 
            onChange={handleAccordionChange('codes')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Classification Codes
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>NAICS Code</InputLabel>
                    <Select
                      value={searchCriteria.naicsCode}
                      label="NAICS Code"
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, naicsCode: e.target.value }))}
                    >
                      <MenuItem value="">All NAICS Codes</MenuItem>
                      {fpdsService.getCommonNAICSCodes().map(naics => (
                        <MenuItem key={naics.code} value={naics.code}>
                          {naics.code} - {naics.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>PSC Code</InputLabel>
                    <Select
                      value={searchCriteria.pscCode}
                      label="PSC Code"
                      onChange={(e) => setSearchCriteria(prev => ({ ...prev, pscCode: e.target.value }))}
                    >
                      <MenuItem value="">All PSC Codes</MenuItem>
                      {fpdsService.getCommonPSCCodes().map(psc => (
                        <MenuItem key={psc.code} value={psc.code}>
                          {psc.code} - {psc.description}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Date and Financial Filters */}
          <Accordion 
            expanded={expandedAccordions.includes('filters')} 
            onChange={handleAccordionChange('filters')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Date & Financial Filters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Signed Date From"
                    type="date"
                    value={searchCriteria.signedDateFrom}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, signedDateFrom: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Signed Date To"
                    type="date"
                    value={searchCriteria.signedDateTo}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, signedDateTo: e.target.value }))}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Min Amount ($)"
                    type="number"
                    value={searchCriteria.dollarAmountFrom}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, dollarAmountFrom: e.target.value }))}
                    placeholder="25000"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <TextField
                    fullWidth
                    label="Max Amount ($)"
                    type="number"
                    value={searchCriteria.dollarAmountTo}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, dollarAmountTo: e.target.value }))}
                    placeholder="10000000"
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Advanced Search */}
          <Accordion 
            expanded={expandedAccordions.includes('advanced')} 
            onChange={handleAccordionChange('advanced')}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                Advanced Parameters
              </Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Description Keywords"
                    value={searchCriteria.descriptionOfRequirement}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, descriptionOfRequirement: e.target.value }))}
                    placeholder="laptop computer desktop monitor"
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Performance State"
                    value={searchCriteria.placeOfPerformanceState}
                    onChange={(e) => setSearchCriteria(prev => ({ ...prev, placeOfPerformanceState: e.target.value }))}
                    placeholder="VA"
                    inputProps={{ maxLength: 2 }}
                  />
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>

          {/* Search Actions */}
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              startIcon={searchMutation.isLoading ? <CircularProgress size={16} /> : <SearchIcon />}
              onClick={handleSearch}
              disabled={searchMutation.isLoading}
              size="large"
            >
              {searchMutation.isLoading ? 'Searching...' : 'Search FPDS'}
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={exportResults}
              disabled={searchResults.length === 0}
            >
              Export as CSV
            </Button>
            <Button
              variant="outlined"
              startIcon={<DownloadIcon />}
              onClick={generatePDFReport}
              disabled={searchResults.length === 0}
            >
              Generate PDF Report
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Search Results ({searchResults.length} contracts)
            </Typography>
            
            <TableContainer component={Paper} sx={{ maxHeight: 600 }}>
              <Table stickyHeader>
                <TableHead>
                  <TableRow>
                    <TableCell>Contract ID</TableCell>
                    <TableCell>Agency</TableCell>
                    <TableCell>Vendor</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Signed Date</TableCell>
                    <TableCell>NAICS</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {searchResults.map((contract, index) => (
                    <TableRow key={contract.id || index} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {contract.piid}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 200 }}>
                          {contract.contractingAgencyName}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ maxWidth: 150 }}>
                          {contract.vendorName}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Chip 
                          label={formatCurrency(contract.dollarAmount)} 
                          color="primary" 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(contract.signedDate)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                          {contract.naicsCode}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography 
                          variant="body2" 
                          sx={{ 
                            maxWidth: 300,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}
                          title={contract.descriptionOfRequirement}
                        >
                          {contract.descriptionOfRequirement}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Tooltip title="View Full Contract Details">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => handleViewContractDetails(contract)}
                          >
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* No Results Message */}
      {searchMutation.isSuccess && searchResults.length === 0 && (
        <Alert severity="info" sx={{ mt: 2 }}>
          No contracts found matching your search criteria. Try adjusting your search parameters.
        </Alert>
      )}

      {/* Schema Dialog */}
      <Dialog open={schemaDialog} onClose={() => setSchemaDialog(false)} maxWidth="lg" fullWidth>
        <DialogTitle>FPDS Search Schema</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Available search parameters for the Federal Procurement Data System
          </Typography>
          
          {Object.entries(fpdsService.getSearchSchema()).map(([category, fields]) => (
            <Box key={category} sx={{ mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 1, textTransform: 'capitalize' }}>
                {category.replace(/([A-Z])/g, ' $1').trim()} Parameters
              </Typography>
              <Grid container spacing={2}>
                {Object.entries(fields).map(([fieldName, fieldInfo]) => (
                  <Grid item xs={12} md={6} key={fieldName}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        {fieldName}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        {fieldInfo.description}
                      </Typography>
                      {fieldInfo.example && (
                        <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', p: 0.5, borderRadius: 1 }}>
                          Example: {fieldInfo.example}
                        </Typography>
                      )}
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ mt: 2 }} />
            </Box>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSchemaDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* History Dialog */}
      <Dialog open={historyDialog} onClose={() => setHistoryDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Search History</DialogTitle>
        <DialogContent>
          {searchHistory.length === 0 ? (
            <Alert severity="info">No search history available</Alert>
          ) : (
            <Box>
              {searchHistory.map((item, index) => (
                <Paper key={item.id} sx={{ p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="subtitle2">
                        Search #{searchHistory.length - index}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        {new Date(item.timestamp).toLocaleString()}
                      </Typography>
                      <Typography variant="body2">
                        {item.resultCount} results found
                      </Typography>
                    </Box>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => loadHistorySearch(item)}
                    >
                      Load Search
                    </Button>
                  </Box>
                </Paper>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setHistoryDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Contract Details Dialog */}
      <ContractDetailsForm
        contract={selectedContract}
        open={contractDetailsDialog}
        onClose={handleCloseContractDetails}
      />
    </Box>
  );
};

export default FPDSSearch;
