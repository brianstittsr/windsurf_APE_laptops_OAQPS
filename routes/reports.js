const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const fs = require('fs').promises;
const path = require('path');
const { db } = require('../config/firebase');
const Invoice = require('../models/Invoice');

// Generate and download report
router.get('/download/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    const { format = 'pdf' } = req.query;
    
    // Get report data from database
    const reportDoc = await db.collection('generated_reports').doc(reportId).get();
    
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Generate file based on format
    let filePath;
    let contentType;
    let filename;
    
    switch (format.toLowerCase()) {
      case 'pdf':
        filePath = await generatePDFReport(reportData, reportId);
        contentType = 'application/pdf';
        filename = `report_${reportId}.pdf`;
        break;
      case 'excel':
      case 'xlsx':
        filePath = await generateExcelReport(reportData, reportId);
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        filename = `report_${reportId}.xlsx`;
        break;
      case 'csv':
        filePath = await generateCSVReport(reportData, reportId);
        contentType = 'text/csv';
        filename = `report_${reportId}.csv`;
        break;
      default:
        return res.status(400).json({ error: 'Unsupported format' });
    }
    
    // Set headers and send file
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    
    const fileBuffer = await fs.readFile(filePath);
    res.send(fileBuffer);
    
    // Clean up temporary file
    await fs.unlink(filePath);
    
    // Log download activity
    await db.collection('activity_logs').add({
      type: 'report_download',
      reportId: reportId,
      format: format,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ 
      error: 'Failed to download report',
      details: error.message 
    });
  }
});

// Generate custom report
router.post('/generate', async (req, res) => {
  try {
    const { 
      title, 
      filters = {}, 
      format = 'pdf', 
      includeCharts = true,
      sections = ['summary', 'details', 'analytics']
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Report title is required' });
    }
    
    // Get invoice data based on filters
    const invoices = await Invoice.getAll(filters);
    const analytics = await Invoice.getAnalytics(filters);
    
    // Create report data structure
    const reportData = {
      title: title,
      generatedAt: new Date().toISOString(),
      filters: filters,
      sections: sections,
      includeCharts: includeCharts,
      data: {
        invoices: invoices,
        analytics: analytics,
        summary: {
          totalInvoices: invoices.length,
          totalValue: analytics.totalValue,
          averageValue: analytics.averageValue,
          dateRange: {
            start: filters.startDate || 'All time',
            end: filters.endDate || 'Present'
          }
        }
      }
    };
    
    // Save report to database
    const reportRef = await db.collection('generated_reports').add({
      ...reportData,
      status: 'generated',
      format: format
    });
    
    // Log report generation
    await db.collection('activity_logs').add({
      type: 'custom_report_generation',
      reportId: reportRef.id,
      title: title,
      format: format,
      invoicesIncluded: invoices.length,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        reportId: reportRef.id,
        title: title,
        format: format,
        invoicesIncluded: invoices.length,
        totalValue: analytics.totalValue,
        downloadUrl: `/api/reports/download/${reportRef.id}?format=${format}`,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error generating custom report:', error);
    res.status(500).json({ 
      error: 'Failed to generate custom report',
      details: error.message 
    });
  }
});

// Get report history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, format } = req.query;
    
    let query = db.collection('generated_reports')
      .orderBy('generatedAt', 'desc');
    
    if (format) {
      query = query.where('format', '==', format);
    }
    
    query = query.limit(parseInt(limit));
    
    const snapshot = await query.get();
    const reports = snapshot.docs.map(doc => ({
      id: doc.id,
      title: doc.data().title,
      format: doc.data().format,
      generatedAt: doc.data().generatedAt,
      status: doc.data().status,
      invoicesIncluded: doc.data().data?.summary?.totalInvoices || 0,
      totalValue: doc.data().data?.summary?.totalValue || 0
    }));
    
    res.json({
      success: true,
      data: reports,
      count: reports.length
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report history',
      details: error.message 
    });
  }
});

// Get report templates
router.get('/templates', async (req, res) => {
  try {
    const templates = [
      {
        id: 'fiscal_year_summary',
        name: 'Fiscal Year Summary',
        description: 'Comprehensive summary of contracts for a specific fiscal year',
        sections: ['summary', 'analytics', 'top_products', 'locations'],
        defaultFilters: { fiscalYear: new Date().getFullYear() }
      },
      {
        id: 'quarterly_report',
        name: 'Quarterly Report',
        description: 'Quarterly analysis of contract activity and spending',
        sections: ['summary', 'trends', 'comparisons'],
        defaultFilters: {}
      },
      {
        id: 'vendor_analysis',
        name: 'Vendor Analysis',
        description: 'Analysis of vendor performance and contract values',
        sections: ['summary', 'vendor_details', 'analytics'],
        defaultFilters: {}
      },
      {
        id: 'location_breakdown',
        name: 'Location Breakdown',
        description: 'Breakdown of contracts by EPA region and location',
        sections: ['summary', 'location_analytics', 'maps'],
        defaultFilters: {}
      },
      {
        id: 'compliance_report',
        name: 'Compliance Report',
        description: 'Contract compliance and audit trail report',
        sections: ['summary', 'compliance_checks', 'audit_trail'],
        defaultFilters: {}
      }
    ];
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Error fetching report templates:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report templates',
      details: error.message 
    });
  }
});

// Helper functions for report generation

async function generatePDFReport(reportData, reportId) {
  const doc = new PDFDocument();
  const filePath = path.join(__dirname, '..', 'temp', `report_${reportId}.pdf`);
  
  // Ensure temp directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  doc.pipe(require('fs').createWriteStream(filePath));
  
  // Header
  doc.fontSize(20).text(reportData.title || 'Contract Analysis Report', 50, 50);
  doc.fontSize(12).text(`Generated: ${new Date(reportData.generatedAt).toLocaleDateString()}`, 50, 80);
  
  let yPosition = 120;
  
  // Summary section
  if (reportData.data && reportData.data.summary) {
    doc.fontSize(16).text('Executive Summary', 50, yPosition);
    yPosition += 30;
    
    doc.fontSize(12)
       .text(`Total Invoices: ${reportData.data.summary.totalInvoices}`, 50, yPosition)
       .text(`Total Value: $${reportData.data.summary.totalValue.toLocaleString()}`, 50, yPosition + 20)
       .text(`Average Value: $${reportData.data.summary.averageValue.toLocaleString()}`, 50, yPosition + 40);
    
    yPosition += 80;
  }
  
  // Content section
  if (reportData.content) {
    doc.fontSize(14).text('Analysis', 50, yPosition);
    yPosition += 25;
    
    const contentLines = reportData.content.split('\n');
    contentLines.forEach(line => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }
      doc.fontSize(10).text(line, 50, yPosition);
      yPosition += 15;
    });
  }
  
  // Analytics section
  if (reportData.data && reportData.data.analytics) {
    if (yPosition > 600) {
      doc.addPage();
      yPosition = 50;
    }
    
    doc.fontSize(16).text('Analytics', 50, yPosition);
    yPosition += 30;
    
    // Fiscal year breakdown
    if (reportData.data.analytics.byFiscalYear) {
      doc.fontSize(14).text('By Fiscal Year:', 50, yPosition);
      yPosition += 20;
      
      Object.entries(reportData.data.analytics.byFiscalYear).forEach(([year, data]) => {
        doc.fontSize(10).text(`FY${year}: ${data.count} invoices, $${data.value.toLocaleString()}`, 70, yPosition);
        yPosition += 15;
      });
    }
  }
  
  doc.end();
  
  // Wait for PDF to be written
  await new Promise((resolve) => {
    doc.on('end', resolve);
  });
  
  return filePath;
}

async function generateExcelReport(reportData, reportId) {
  const workbook = new ExcelJS.Workbook();
  const filePath = path.join(__dirname, '..', 'temp', `report_${reportId}.xlsx`);
  
  // Ensure temp directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  // Summary worksheet
  const summarySheet = workbook.addWorksheet('Summary');
  summarySheet.columns = [
    { header: 'Metric', key: 'metric', width: 30 },
    { header: 'Value', key: 'value', width: 20 }
  ];
  
  if (reportData.data && reportData.data.summary) {
    summarySheet.addRows([
      { metric: 'Report Title', value: reportData.title },
      { metric: 'Generated Date', value: new Date(reportData.generatedAt).toLocaleDateString() },
      { metric: 'Total Invoices', value: reportData.data.summary.totalInvoices },
      { metric: 'Total Value', value: `$${reportData.data.summary.totalValue.toLocaleString()}` },
      { metric: 'Average Value', value: `$${reportData.data.summary.averageValue.toLocaleString()}` }
    ]);
  }
  
  // Invoice details worksheet
  if (reportData.data && reportData.data.invoices) {
    const detailsSheet = workbook.addWorksheet('Invoice Details');
    detailsSheet.columns = [
      { header: 'Invoice ID', key: 'id', width: 20 },
      { header: 'Contract Number', key: 'contractNumber', width: 25 },
      { header: 'Total Amount', key: 'totalAmount', width: 15 },
      { header: 'Fiscal Year', key: 'fiscalYear', width: 12 },
      { header: 'Upload Date', key: 'uploadDate', width: 15 },
      { header: 'Schema', key: 'schema', width: 20 }
    ];
    
    reportData.data.invoices.forEach(invoice => {
      detailsSheet.addRow({
        id: invoice.id,
        contractNumber: invoice.contractInfo?.contractNumber || 'N/A',
        totalAmount: invoice.totalAwardAmount,
        fiscalYear: invoice.fiscalYear,
        uploadDate: new Date(invoice.uploadDate).toLocaleDateString(),
        schema: invoice.schema
      });
    });
  }
  
  // Analytics worksheet
  if (reportData.data && reportData.data.analytics) {
    const analyticsSheet = workbook.addWorksheet('Analytics');
    
    // Fiscal year data
    if (reportData.data.analytics.byFiscalYear) {
      analyticsSheet.addRow(['Fiscal Year Analysis']);
      analyticsSheet.addRow(['Year', 'Count', 'Total Value']);
      
      Object.entries(reportData.data.analytics.byFiscalYear).forEach(([year, data]) => {
        analyticsSheet.addRow([year, data.count, data.value]);
      });
    }
  }
  
  await workbook.xlsx.writeFile(filePath);
  return filePath;
}

async function generateCSVReport(reportData, reportId) {
  const filePath = path.join(__dirname, '..', 'temp', `report_${reportId}.csv`);
  
  // Ensure temp directory exists
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  
  const csvWriter = createCsvWriter({
    path: filePath,
    header: [
      { id: 'id', title: 'Invoice ID' },
      { id: 'contractNumber', title: 'Contract Number' },
      { id: 'totalAmount', title: 'Total Amount' },
      { id: 'fiscalYear', title: 'Fiscal Year' },
      { id: 'uploadDate', title: 'Upload Date' },
      { id: 'schema', title: 'Schema' },
      { id: 'locationsCount', title: 'Locations Count' },
      { id: 'productsCount', title: 'Products Count' }
    ]
  });
  
  const records = [];
  
  if (reportData.data && reportData.data.invoices) {
    reportData.data.invoices.forEach(invoice => {
      records.push({
        id: invoice.id,
        contractNumber: invoice.contractInfo?.contractNumber || 'N/A',
        totalAmount: invoice.totalAwardAmount,
        fiscalYear: invoice.fiscalYear,
        uploadDate: new Date(invoice.uploadDate).toLocaleDateString(),
        schema: invoice.schema,
        locationsCount: invoice.deliveryLocations?.length || 0,
        productsCount: invoice.productDetails?.length || 0
      });
    });
  }
  
  await csvWriter.writeRecords(records);
  return filePath;
}

module.exports = router;
