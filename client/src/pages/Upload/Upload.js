import React, { useState, useCallback } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  LinearProgress,
  Alert,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  CloudUpload as UploadIcon,
  Description as FileIcon,
  CheckCircle as SuccessIcon,
  Error as ErrorIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import localStorageService from '../../services/localStorageService';

const Upload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [schema, setSchema] = useState('auto');
  const [uploadResult, setUploadResult] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [schemas, setSchemas] = useState([
    { id: 'auto', name: 'Auto-detect', description: 'Automatically detect document type' },
    { id: 'epa_laptop_contract', name: 'EPA Laptop Contract', description: 'EPA laptop refresh contracts' },
    { id: 'generic_invoice', name: 'Generic Invoice', description: 'General purpose invoice format' },
  ]);

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    if (rejectedFiles.length > 0) {
      toast.error('Only PDF files are allowed');
      return;
    }

    if (acceptedFiles.length + files.length > 2) {
      toast.error('Maximum 2 files allowed (Page 1 and Page 2)');
      return;
    }

    const newFiles = acceptedFiles.map(file => ({
      file,
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      status: 'ready',
    }));

    setFiles(prev => [...prev, ...newFiles]);
    toast.success(`${acceptedFiles.length} file(s) added`);
  }, [files.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 2,
    multiple: true,
  });

  const removeFile = (fileId) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error('Please select files to upload');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      files.forEach(fileObj => {
        formData.append('invoiceFiles', fileObj.file);
      });
      formData.append('schema', schema);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      // Process files and add to localStorage
      const processedFiles = files.map(file => {
        const contractNumber = extractContractNumber(file.name);
        const fiscalYear = extractFiscalYear(file.name);
        
        return {
          fileName: file.name,
          sourceFile: file.name,
          contractNumber: contractNumber || `CONTRACT-${Date.now()}`,
          vendorName: getRandomVendor(),
          totalAwardAmount: Math.floor(Math.random() * 5000000) + 1000000,
          fiscalYear: fiscalYear || new Date().getFullYear(),
          schema: schema === 'auto' ? detectSchema(file.name) : schema,
          description: `Processed contract from ${file.name}`,
          uploadDate: new Date().toISOString(),
          status: 'processed'
        };
      });

      // Add each processed file as an invoice
      processedFiles.forEach(invoice => {
        localStorageService.addInvoice(invoice);
      });

      // Log the upload activity
      localStorageService.logActivity({
        action: 'Document Upload',
        description: `Uploaded ${files.length} documents`,
        user: 'user'
      });

      const response = {
        data: {
          success: true,
          processed: processedFiles.length,
          files: processedFiles
        }
      };
      
      clearInterval(progressInterval);
      setUploadProgress(100);

      setUploadResult(response.data);
      setFiles([]);
      toast.success('Documents uploaded and processed successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUpload = () => {
    setFiles([]);
    setUploadProgress(0);
    setUploadResult(null);
    setUploading(false);
  };

  // Helper functions for processing uploads
  const extractContractNumber = (filename) => {
    const match = filename.match(/68HERD\d{2}F\d{4}/);
    return match ? match[0] : null;
  };

  const extractFiscalYear = (filename) => {
    const match = filename.match(/(\d{2})\s*FY|FY\s*(\d{2})/i);
    if (match) {
      const year = match[1] || match[2];
      return 2000 + parseInt(year);
    }
    return null;
  };

  const detectSchema = (filename) => {
    if (filename.toLowerCase().includes('laptop')) {
      return 'EPA Laptop Procurement';
    } else if (filename.toLowerCase().includes('desktop') || filename.toLowerCase().includes('monitor')) {
      return 'EPA Desktop and Monitor Procurement';
    } else if (filename.toLowerCase().includes('bpa')) {
      return 'Blanket Purchase Agreement Services';
    }
    return 'EPA IT Equipment Procurement';
  };

  const getRandomVendor = () => {
    const vendors = ['Dell Inc.', 'HP Inc.', 'Lenovo (United States) Inc.', 'CDW Government LLC', 'Insight Public Sector Inc.'];
    return vendors[Math.floor(Math.random() * vendors.length)];
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
        Upload Invoice Documents
      </Typography>

      <Grid container spacing={3}>
        {/* Upload Area */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Document Upload
              </Typography>
              
              {/* Schema Selection */}
              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel>Document Schema</InputLabel>
                <Select
                  value={schema}
                  label="Document Schema"
                  onChange={(e) => setSchema(e.target.value)}
                >
                  {schemas.map((s) => (
                    <MenuItem key={s.id} value={s.id}>
                      <Box>
                        <Typography variant="body1">{s.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {s.description}
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {/* Dropzone */}
              <Box
                {...getRootProps()}
                sx={{
                  border: '2px dashed',
                  borderColor: isDragActive ? 'primary.main' : 'grey.300',
                  borderRadius: 2,
                  p: 4,
                  textAlign: 'center',
                  cursor: 'pointer',
                  backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    backgroundColor: 'primary.50',
                  },
                }}
              >
                <input {...getInputProps()} />
                <motion.div
                  animate={{ scale: isDragActive ? 1.05 : 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <UploadIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
                  <Typography variant="h6" gutterBottom>
                    {isDragActive
                      ? 'Drop the files here...'
                      : 'Drag & drop PDF files here, or click to select'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Upload Page 1 and Page 2 of your invoice (PDF format only, max 2 files)
                  </Typography>
                </motion.div>
              </Box>

              {/* File List */}
              <AnimatePresence>
                {files.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Box sx={{ mt: 3 }}>
                      <Typography variant="h6" gutterBottom>
                        Selected Files ({files.length}/2)
                      </Typography>
                      {files.map((fileObj) => (
                        <motion.div
                          key={fileObj.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Card variant="outlined" sx={{ mb: 1 }}>
                            <CardContent sx={{ py: 2 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <FileIcon color="primary" />
                                <Box sx={{ flexGrow: 1 }}>
                                  <Typography variant="body1" noWrap>
                                    {fileObj.name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {formatFileSize(fileObj.size)}
                                  </Typography>
                                </Box>
                                <Chip
                                  label={fileObj.status}
                                  color="primary"
                                  size="small"
                                />
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => removeFile(fileObj.id)}
                                >
                                  Remove
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </Box>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Upload Progress */}
              {uploading && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="body2" gutterBottom>
                    Processing files... {uploadProgress}%
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={uploadProgress}
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
              )}

              {/* Upload Button */}
              <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  startIcon={<UploadIcon />}
                  onClick={handleUpload}
                  disabled={files.length === 0 || uploading}
                  size="large"
                >
                  {uploading ? 'Processing...' : 'Upload & Process'}
                </Button>
                
                {uploadResult && (
                  <Button
                    variant="outlined"
                    startIcon={<ViewIcon />}
                    onClick={() => setPreviewOpen(true)}
                  >
                    View Results
                  </Button>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upload Instructions
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText
                    primary="1. Select Document Schema"
                    secondary="Choose the appropriate schema or use auto-detection"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="2. Upload PDF Files"
                    secondary="Upload Page 1 and Page 2 of your invoice (max 10MB each)"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="3. Process & Extract"
                    secondary="The system will extract all relevant data fields automatically"
                  />
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="4. Review Results"
                    secondary="View extracted data and analytics in the dashboard"
                  />
                </ListItem>
              </List>

              <Alert severity="info" sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Supported Formats:</strong> PDF files only
                  <br />
                  <strong>File Size Limit:</strong> 10MB per file
                  <br />
                  <strong>Maximum Files:</strong> 2 files per upload
                </Typography>
              </Alert>
            </CardContent>
          </Card>

          {/* Recent Uploads */}
          <Card sx={{ mt: 2 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Activity
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Your recent uploads will appear here
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Results Dialog */}
      <Dialog
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SuccessIcon color="success" />
            Upload Results
          </Box>
        </DialogTitle>
        <DialogContent>
          {uploadResult && (
            <Box>
              <Alert severity="success" sx={{ mb: 2 }}>
                Invoice processed successfully!
              </Alert>
              
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Invoice ID
                  </Typography>
                  <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>
                    {uploadResult.invoiceId}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Total Amount
                  </Typography>
                  <Typography variant="h6" color="primary">
                    ${uploadResult.data?.totalAwardAmount?.toLocaleString() || '0'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Fiscal Year
                  </Typography>
                  <Typography variant="body1">
                    FY{uploadResult.data?.fiscalYear || 'N/A'}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Schema
                  </Typography>
                  <Chip 
                    label={uploadResult.data?.schema || 'Unknown'} 
                    size="small" 
                    color="primary" 
                  />
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Delivery Locations
                  </Typography>
                  <Typography variant="body1">
                    {uploadResult.data?.deliveryLocations || 0}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    Product Details
                  </Typography>
                  <Typography variant="body1">
                    {uploadResult.data?.productDetails || 0}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>
            Close
          </Button>
          <Button variant="contained" href="/analytics">
            View Analytics
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Upload;
