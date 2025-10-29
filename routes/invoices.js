const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const PDFExtractor = require('../services/pdfExtractor');
const { db } = require('../config/firebase');

// Upload and process invoice files
router.post('/upload', async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { schema = 'auto' } = req.body;
    const uploadedFiles = [];
    let combinedText = '';

    // Process each uploaded file
    for (const file of req.files) {
      try {
        console.log(`Processing file: ${file.originalname}`);
        
        // Extract text from PDF
        const extractedText = await PDFExtractor.extractText(file.buffer);
        combinedText += extractedText + '\n\n';

        uploadedFiles.push({
          originalName: file.originalname,
          size: file.size,
          mimetype: file.mimetype,
          uploadDate: new Date().toISOString()
        });

        console.log(`Successfully extracted text from ${file.originalname}`);
      } catch (error) {
        console.error(`Error processing file ${file.originalname}:`, error);
        return res.status(500).json({ 
          error: `Failed to process file ${file.originalname}: ${error.message}` 
        });
      }
    }

    // Parse the combined text to extract invoice data
    console.log('Parsing extracted text...');
    const parsedData = PDFExtractor.parseInvoiceData(combinedText, schema);
    
    // Create invoice object
    const invoiceData = {
      ...parsedData,
      originalFiles: uploadedFiles,
      extractedText: combinedText,
      uploadDate: new Date().toISOString(),
      status: 'processed'
    };

    const invoice = new Invoice(invoiceData);
    
    // Save to Firebase
    console.log('Saving invoice to database...');
    const invoiceId = await invoice.save();

    // Log the upload activity
    await db.collection('activity_logs').add({
      type: 'invoice_upload',
      invoiceId: invoiceId,
      filesCount: req.files.length,
      totalAmount: invoice.totalAwardAmount,
      schema: invoice.schema,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    console.log(`Invoice ${invoiceId} saved successfully`);

    res.status(201).json({
      success: true,
      invoiceId: invoiceId,
      message: 'Invoice uploaded and processed successfully',
      data: {
        id: invoice.id,
        totalAwardAmount: invoice.totalAwardAmount,
        fiscalYear: invoice.fiscalYear,
        schema: invoice.schema,
        filesProcessed: uploadedFiles.length,
        deliveryLocations: invoice.deliveryLocations.length,
        productDetails: invoice.productDetails.length
      }
    });

  } catch (error) {
    console.error('Error uploading invoice:', error);
    res.status(500).json({ 
      error: 'Failed to upload and process invoice',
      details: error.message 
    });
  }
});

// Get all invoices with optional filters
router.get('/', async (req, res) => {
  try {
    const filters = {
      fiscalYear: req.query.fiscalYear,
      schema: req.query.schema,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      limit: req.query.limit || 50
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const invoices = await Invoice.getAll(filters);
    
    res.json({
      success: true,
      count: invoices.length,
      data: invoices.map(invoice => ({
        id: invoice.id,
        contractInfo: invoice.contractInfo,
        totalAwardAmount: invoice.totalAwardAmount,
        fiscalYear: invoice.fiscalYear,
        uploadDate: invoice.uploadDate,
        schema: invoice.schema,
        status: invoice.status,
        filesCount: invoice.originalFiles.length,
        locationsCount: invoice.deliveryLocations.length,
        productsCount: invoice.productDetails.length
      }))
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoices',
      details: error.message 
    });
  }
});

// Get invoice by ID
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.getById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    res.json({
      success: true,
      data: invoice
    });
  } catch (error) {
    console.error('Error fetching invoice:', error);
    res.status(500).json({ 
      error: 'Failed to fetch invoice',
      details: error.message 
    });
  }
});

// Search invoices
router.get('/search/:term', async (req, res) => {
  try {
    const searchTerm = req.params.term;
    const filters = {
      fiscalYear: req.query.fiscalYear,
      schema: req.query.schema,
      limit: req.query.limit || 50
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const invoices = await Invoice.search(searchTerm, filters);
    
    res.json({
      success: true,
      searchTerm: searchTerm,
      count: invoices.length,
      data: invoices.map(invoice => ({
        id: invoice.id,
        contractInfo: invoice.contractInfo,
        totalAwardAmount: invoice.totalAwardAmount,
        fiscalYear: invoice.fiscalYear,
        uploadDate: invoice.uploadDate,
        schema: invoice.schema,
        relevantText: invoice.extractedText.substring(0, 200) + '...'
      }))
    });
  } catch (error) {
    console.error('Error searching invoices:', error);
    res.status(500).json({ 
      error: 'Failed to search invoices',
      details: error.message 
    });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.getById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const updatedInvoice = await invoice.update(req.body);
    
    // Log the update activity
    await db.collection('activity_logs').add({
      type: 'invoice_update',
      invoiceId: req.params.id,
      updates: Object.keys(req.body),
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: 'Invoice updated successfully',
      data: updatedInvoice
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    res.status(500).json({ 
      error: 'Failed to update invoice',
      details: error.message 
    });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.getById(req.params.id);
    
    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    await invoice.delete();
    
    // Log the deletion activity
    await db.collection('activity_logs').add({
      type: 'invoice_delete',
      invoiceId: req.params.id,
      timestamp: new Date().toISOString(),
      userAgent: req.get('User-Agent') || 'Unknown'
    });

    res.json({
      success: true,
      message: 'Invoice deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting invoice:', error);
    res.status(500).json({ 
      error: 'Failed to delete invoice',
      details: error.message 
    });
  }
});

// Get supported schemas
router.get('/schemas/list', async (req, res) => {
  try {
    const schemas = [
      {
        id: 'epa_laptop_contract',
        name: 'EPA Laptop Contract',
        description: 'EPA laptop refresh contracts and orders',
        fields: [
          'contractInfo', 'orderDetails', 'deliveryPerformance',
          'deliveryLocations', 'productDetails', 'totalAwardAmount',
          'contractAdministration', 'contactInfo', 'contractClauses'
        ]
      },
      {
        id: 'generic_invoice',
        name: 'Generic Invoice',
        description: 'General purpose invoice format',
        fields: [
          'contractInfo', 'totalAwardAmount', 'fiscalYear'
        ]
      }
    ];

    res.json({
      success: true,
      data: schemas
    });
  } catch (error) {
    console.error('Error fetching schemas:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schemas',
      details: error.message 
    });
  }
});

module.exports = router;
