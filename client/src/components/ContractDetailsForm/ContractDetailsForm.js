import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Typography,
  Card,
  CardContent,
  Box,
  Chip,
  Divider,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Paper,
  Link
} from '@mui/material';
import {
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  AccountBalance as AgencyIcon,
  AttachMoney as MoneyIcon,
  LocationOn as LocationIcon,
  Description as DescriptionIcon,
  Gavel as ContractIcon,
  Security as ComplianceIcon,
  Timeline as TimelineIcon,
  Assessment as ClassificationIcon
} from '@mui/icons-material';

const ContractDetailsForm = ({ contract, open, onClose }) => {
  if (!contract) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount) => {
    if (!amount || amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const InfoRow = ({ label, value, fullWidth = false }) => (
    <TableRow>
      <TableCell 
        component="th" 
        scope="row" 
        sx={{ 
          fontWeight: 'bold', 
          bgcolor: 'grey.50',
          width: fullWidth ? '20%' : '30%'
        }}
      >
        {label}
      </TableCell>
      <TableCell sx={{ wordBreak: 'break-word' }}>
        {value || 'N/A'}
      </TableCell>
    </TableRow>
  );

  const SectionCard = ({ title, icon, children, defaultExpanded = false }) => (
    <Accordion defaultExpanded={defaultExpanded}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {icon}
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
            {title}
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableBody>
              {children}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Dialog 
      open={open} 
      onClose={onClose} 
      maxWidth="lg" 
      fullWidth
      PaperProps={{
        sx: { height: '90vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h5" component="div" sx={{ fontWeight: 'bold' }}>
              Contract Details
            </Typography>
            <Typography variant="subtitle1" color="textSecondary">
              {contract.piid} - {contract.vendorName}
            </Typography>
          </Box>
          <IconButton onClick={onClose} size="large">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers sx={{ p: 0 }}>
        <Box sx={{ p: 3 }}>
          {/* Summary Header */}
          <Card sx={{ mb: 3, bgcolor: 'primary.50' }}>
            <CardContent>
              <Grid container spacing={2}>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Contract Value
                  </Typography>
                  <Typography variant="h5" color="primary" sx={{ fontWeight: 'bold' }}>
                    {formatCurrency(contract.dollarAmount)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Signed Date
                  </Typography>
                  <Typography variant="h6">
                    {formatDate(contract.signedDate)}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Fiscal Year
                  </Typography>
                  <Typography variant="h6">
                    FY{contract.fiscalYear || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={12} md={3}>
                  <Typography variant="caption" color="textSecondary">
                    Contract Type
                  </Typography>
                  <Typography variant="h6">
                    {contract.typeOfContract || 'N/A'}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <SectionCard 
            title="Basic Information" 
            icon={<DescriptionIcon color="primary" />}
            defaultExpanded={true}
          >
            <InfoRow label="Contract ID (PIID)" value={contract.piid} />
            <InfoRow label="Modification Number" value={contract.modNumber} />
            <InfoRow label="Transaction Number" value={contract.transactionNumber} />
            <InfoRow label="Title" value={contract.title} />
            <InfoRow 
              label="Description" 
              value={contract.descriptionOfRequirement} 
              fullWidth={true}
            />
            <InfoRow label="Contract Action Type" value={contract.contractActionType} />
            <InfoRow label="Reason for Modification" value={contract.reasonForModification} />
          </SectionCard>

          {/* Agency Information */}
          <SectionCard 
            title="Agency Information" 
            icon={<AgencyIcon color="primary" />}
          >
            <InfoRow label="Contracting Agency" value={contract.contractingAgencyName} />
            <InfoRow label="Contracting Agency ID" value={contract.contractingAgencyId} />
            <InfoRow label="Contracting Office" value={contract.contractingOfficeName} />
            <InfoRow label="Contracting Office ID" value={contract.contractingOfficeId} />
            <InfoRow label="Funding Agency" value={contract.fundingAgencyName} />
            <InfoRow label="Funding Agency ID" value={contract.fundingAgencyId} />
          </SectionCard>

          {/* Vendor Information */}
          <SectionCard 
            title="Vendor Information" 
            icon={<BusinessIcon color="primary" />}
          >
            <InfoRow label="Vendor Name" value={contract.vendorName} />
            <InfoRow label="DUNS Number" value={contract.vendorDunsNumber} />
            <InfoRow label="Legal Organization Name" value={contract.vendorLegalOrgName} />
            <InfoRow label="Doing Business As" value={contract.vendorDoingAsBusinessName} />
            <InfoRow label="Alternate Name" value={contract.vendorAlternateName} />
            <InfoRow label="Address Line 1" value={contract.vendorAddressLine1} />
            <InfoRow label="Address Line 2" value={contract.vendorAddressLine2} />
            <InfoRow label="City" value={contract.vendorCity} />
            <InfoRow label="State" value={contract.vendorState} />
            <InfoRow label="ZIP Code" value={contract.vendorZipCode} />
            <InfoRow label="Country Code" value={contract.vendorCountryCode} />
            <InfoRow label="Phone Number" value={contract.vendorPhoneNumber} />
            <InfoRow label="Fax Number" value={contract.vendorFaxNumber} />
          </SectionCard>

          {/* Financial Information */}
          <SectionCard 
            title="Financial Information" 
            icon={<MoneyIcon color="primary" />}
          >
            <InfoRow 
              label="Dollars Obligated" 
              value={formatCurrency(contract.dollarAmount)} 
            />
            <InfoRow 
              label="Base & Exercised Options Value" 
              value={formatCurrency(contract.baseAndExercisedOptionsValue)} 
            />
            <InfoRow 
              label="Base & All Options Value" 
              value={formatCurrency(contract.baseAndAllOptionsValue)} 
            />
          </SectionCard>

          {/* Timeline Information */}
          <SectionCard 
            title="Timeline Information" 
            icon={<TimelineIcon color="primary" />}
          >
            <InfoRow label="Signed Date" value={formatDate(contract.signedDate)} />
            <InfoRow label="Effective Date" value={formatDate(contract.effectiveDate)} />
            <InfoRow label="Current Completion Date" value={formatDate(contract.currentCompletionDate)} />
            <InfoRow label="Ultimate Completion Date" value={formatDate(contract.ultimateCompletionDate)} />
            <InfoRow label="Last Modified" value={formatDate(contract.lastModified)} />
          </SectionCard>

          {/* Classification Information */}
          <SectionCard 
            title="Classification Information" 
            icon={<ClassificationIcon color="primary" />}
          >
            <InfoRow label="NAICS Code" value={contract.naicsCode} />
            <InfoRow label="NAICS Description" value={contract.naicsDescription} />
            <InfoRow label="PSC Code" value={contract.pscCode} />
            <InfoRow label="PSC Description" value={contract.pscDescription} />
          </SectionCard>

          {/* Contract Details */}
          <SectionCard 
            title="Contract Details" 
            icon={<ContractIcon color="primary" />}
          >
            <InfoRow label="Type of Contract" value={contract.typeOfContract} />
            <InfoRow label="Contract Pricing Type" value={contract.typeOfContractPricing} />
            <InfoRow label="Extent Competed" value={contract.extentCompeted} />
            <InfoRow label="Reason Not Competed" value={contract.reasonNotCompeted} />
            <InfoRow label="Number of Offers Received" value={contract.numberOfOffersReceived} />
            <InfoRow label="Set-Aside Type" value={contract.setAsideType} />
            <InfoRow label="Type of Set-Aside" value={contract.typeOfSetAside} />
          </SectionCard>

          {/* Performance Location */}
          <SectionCard 
            title="Performance Location" 
            icon={<LocationIcon color="primary" />}
          >
            <InfoRow label="City" value={contract.placeOfPerformanceCity} />
            <InfoRow label="State" value={contract.placeOfPerformanceState} />
            <InfoRow label="Country" value={contract.placeOfPerformanceCountry} />
            <InfoRow label="ZIP Code" value={contract.placeOfPerformanceZip} />
            <InfoRow label="Principal Place of Performance" value={contract.principalPlaceOfPerformance} />
          </SectionCard>

          {/* Compliance & Socioeconomic */}
          <SectionCard 
            title="Compliance & Socioeconomic Information" 
            icon={<ComplianceIcon color="primary" />}
          >
            <InfoRow label="Business Size Determination" value={contract.contractingOfficerBusinessSizeDetermination} />
            <InfoRow label="Commercial Item Procedures" value={contract.commercialItemAcquisitionProcedures} />
            <InfoRow label="Commercial Item Test Program" value={contract.commercialItemTestProgram} />
            <InfoRow label="Consolidated Contract" value={contract.consolidatedContract} />
            <InfoRow label="Cost or Pricing Data" value={contract.costOrPricingData} />
            <InfoRow label="Cost Accounting Standards" value={contract.costAccountingStandardsClause} />
            <InfoRow label="Woman-Owned Small Business" value={contract.womanOwnedSmallBusiness} />
            <InfoRow label="Veteran-Owned Small Business" value={contract.veteranOwnedSmallBusiness} />
            <InfoRow label="Service-Disabled Veteran-Owned" value={contract.serviceDisabledVeteranOwnedSmallBusiness} />
            <InfoRow label="HUBZone Small Business" value={contract.hubzoneSmallBusiness} />
            <InfoRow label="Small Disadvantaged Business" value={contract.smallDisadvantagedBusiness} />
            <InfoRow label="Historically Black College/University" value={contract.historicallyBlackCollegeOrUniversity} />
          </SectionCard>

          {/* System Information */}
          <SectionCard 
            title="System Information" 
            icon={<DescriptionIcon color="primary" />}
          >
            <InfoRow label="Last Updated" value={formatDate(contract.updated)} />
            <InfoRow 
              label="FPDS Link" 
              value={
                contract.link ? (
                  <Link href={contract.link} target="_blank" rel="noopener noreferrer">
                    View in FPDS
                  </Link>
                ) : 'N/A'
              } 
            />
          </SectionCard>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Close
        </Button>
        <Button 
          variant="contained" 
          onClick={() => {
            // Export contract details as JSON
            const dataStr = JSON.stringify(contract, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `contract_${contract.piid || 'details'}.json`;
            link.click();
            URL.revokeObjectURL(url);
          }}
        >
          Export Details
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ContractDetailsForm;
