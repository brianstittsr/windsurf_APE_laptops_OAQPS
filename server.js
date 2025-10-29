const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const invoiceRoutes = require('./routes/invoices');
const analyticsRoutes = require('./routes/analytics');
const chatRoutes = require('./routes/chat');
const reportRoutes = require('./routes/reports');
const emailRoutes = require('./routes/email');
const settingsRoutes = require('./routes/settings');
const logRoutes = require('./routes/logs');

const app = express();
const PORT = process.env.PORT || 5001;

// Add logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Security middleware
app.use(helmet.contentSecurityPolicy({
  directives: {
    ...helmet.contentSecurityPolicy.getDefaultDirectives(),
    'connect-src': ["'self'", 'https://www.airnowapi.org'],
  },
}));
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://epa-oid-analytics.app.cloud.gov', process.env.ALLOWED_ORIGINS || ''] 
    : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'), false);
    }
  }
});

// Routes
app.use('/api/invoices', upload.array('invoiceFiles', 2), invoiceRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/email', emailRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/logs', logRoutes);

// Serve PDF files from datafiles folder
app.get('/api/pdfs/:filename', (req, res) => {
  const filename = decodeURIComponent(req.params.filename);
  const filePath = path.join(__dirname, 'datafiles', filename);
  
  // Check if file exists
  const fs = require('fs');
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'PDF file not found' });
  }
});

// Serve static files from React build
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: 'File too large. Maximum size is 10MB.' });
    }
  }
  
  res.status(500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : error.message 
  });
});

app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.listen(PORT, () => {
  console.log(`🚀 EPA OID Planning and Management Tool Server running on port ${PORT}`);
  console.log(`📊 Frontend should connect from http://localhost:3001`);
  console.log(`🔗 AI Proxy endpoint: http://localhost:${PORT}/api/chat/ai-proxy`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});
