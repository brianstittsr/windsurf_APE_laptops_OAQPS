const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db } = require('../config/firebase');
const fs = require('fs').promises;
const path = require('path');

// Configure email transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Send report via email
router.post('/send-report', async (req, res) => {
  try {
    const { 
      reportId, 
      recipients, 
      subject, 
      message = '', 
      format = 'pdf',
      includeAttachment = true 
    } = req.body;
    
    if (!reportId || !recipients || recipients.length === 0) {
      return res.status(400).json({ 
        error: 'Report ID and recipients are required' 
      });
    }
    
    // Get report data
    const reportDoc = await db.collection('generated_reports').doc(reportId).get();
    if (!reportDoc.exists) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const reportData = reportDoc.data();
    
    // Create email transporter
    const transporter = createTransporter();
    
    // Prepare email content
    const emailSubject = subject || `Contract Analysis Report - ${reportData.title}`;
    const emailBody = createEmailBody(reportData, message);
    
    let attachments = [];
    
    if (includeAttachment) {
      // Generate report file for attachment
      const reportFilePath = await generateReportFile(reportData, reportId, format);
      
      attachments.push({
        filename: `report_${reportId}.${format}`,
        path: reportFilePath,
        contentType: getContentType(format)
      });
    }
    
    // Send email to each recipient
    const emailPromises = recipients.map(async (recipient) => {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: recipient,
        subject: emailSubject,
        html: emailBody,
        attachments: attachments
      };
      
      return transporter.sendMail(mailOptions);
    });
    
    await Promise.all(emailPromises);
    
    // Clean up attachment file
    if (includeAttachment && attachments.length > 0) {
      await fs.unlink(attachments[0].path);
    }
    
    // Log email activity
    await db.collection('activity_logs').add({
      type: 'email_sent',
      reportId: reportId,
      recipients: recipients,
      subject: emailSubject,
      includeAttachment: includeAttachment,
      format: format,
      timestamp: new Date().toISOString()
    });
    
    // Save email record
    await db.collection('email_history').add({
      reportId: reportId,
      recipients: recipients,
      subject: emailSubject,
      message: message,
      format: format,
      includeAttachment: includeAttachment,
      sentAt: new Date().toISOString(),
      status: 'sent'
    });
    
    res.json({
      success: true,
      message: `Report sent successfully to ${recipients.length} recipient(s)`,
      data: {
        reportId: reportId,
        recipients: recipients,
        subject: emailSubject,
        sentAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Error sending email:', error);
    
    // Log error
    await db.collection('activity_logs').add({
      type: 'error',
      operation: 'email_send',
      error: error.message,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      error: 'Failed to send email',
      details: error.message 
    });
  }
});

// Schedule automated email
router.post('/schedule', async (req, res) => {
  try {
    const { 
      name,
      description,
      recipients, 
      reportConfig,
      schedule, // { frequency: 'daily|weekly|monthly', time: 'HH:MM', dayOfWeek?: 0-6, dayOfMonth?: 1-31 }
      active = true 
    } = req.body;
    
    if (!name || !recipients || !reportConfig || !schedule) {
      return res.status(400).json({ 
        error: 'Name, recipients, report config, and schedule are required' 
      });
    }
    
    // Validate schedule
    if (!['daily', 'weekly', 'monthly'].includes(schedule.frequency)) {
      return res.status(400).json({ 
        error: 'Schedule frequency must be daily, weekly, or monthly' 
      });
    }
    
    // Save scheduled email
    const scheduledEmailData = {
      name: name,
      description: description || '',
      recipients: recipients,
      reportConfig: reportConfig,
      schedule: schedule,
      active: active,
      createdAt: new Date().toISOString(),
      lastRun: null,
      nextRun: calculateNextRun(schedule),
      runCount: 0
    };
    
    const docRef = await db.collection('scheduled_emails').add(scheduledEmailData);
    
    // Log scheduling activity
    await db.collection('activity_logs').add({
      type: 'email_scheduled',
      scheduledEmailId: docRef.id,
      name: name,
      frequency: schedule.frequency,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Email scheduled successfully',
      data: {
        id: docRef.id,
        name: name,
        nextRun: scheduledEmailData.nextRun,
        recipients: recipients.length
      }
    });
    
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(500).json({ 
      error: 'Failed to schedule email',
      details: error.message 
    });
  }
});

// Get scheduled emails
router.get('/scheduled', async (req, res) => {
  try {
    const { active } = req.query;
    
    let query = db.collection('scheduled_emails');
    
    if (active !== undefined) {
      query = query.where('active', '==', active === 'true');
    }
    
    const snapshot = await query.orderBy('createdAt', 'desc').get();
    const scheduledEmails = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: scheduledEmails,
      count: scheduledEmails.length
    });
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ 
      error: 'Failed to fetch scheduled emails',
      details: error.message 
    });
  }
});

// Update scheduled email
router.put('/scheduled/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    // Recalculate next run if schedule is updated
    if (updates.schedule) {
      updates.nextRun = calculateNextRun(updates.schedule);
    }
    
    await db.collection('scheduled_emails').doc(id).update({
      ...updates,
      updatedAt: new Date().toISOString()
    });
    
    res.json({
      success: true,
      message: 'Scheduled email updated successfully'
    });
  } catch (error) {
    console.error('Error updating scheduled email:', error);
    res.status(500).json({ 
      error: 'Failed to update scheduled email',
      details: error.message 
    });
  }
});

// Delete scheduled email
router.delete('/scheduled/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    await db.collection('scheduled_emails').doc(id).delete();
    
    res.json({
      success: true,
      message: 'Scheduled email deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting scheduled email:', error);
    res.status(500).json({ 
      error: 'Failed to delete scheduled email',
      details: error.message 
    });
  }
});

// Get email history
router.get('/history', async (req, res) => {
  try {
    const { limit = 50, reportId } = req.query;
    
    let query = db.collection('email_history')
      .orderBy('sentAt', 'desc');
    
    if (reportId) {
      query = query.where('reportId', '==', reportId);
    }
    
    query = query.limit(parseInt(limit));
    
    const snapshot = await query.get();
    const emailHistory = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: emailHistory,
      count: emailHistory.length
    });
  } catch (error) {
    console.error('Error fetching email history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch email history',
      details: error.message 
    });
  }
});

// Test email configuration
router.post('/test', async (req, res) => {
  try {
    const { recipient } = req.body;
    
    if (!recipient) {
      return res.status(400).json({ error: 'Recipient email is required' });
    }
    
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: recipient,
      subject: 'Invoice Analytics App - Email Test',
      html: `
        <h2>Email Configuration Test</h2>
        <p>This is a test email from the Invoice Analytics Application.</p>
        <p>If you received this email, the email configuration is working correctly.</p>
        <p><strong>Sent at:</strong> ${new Date().toLocaleString()}</p>
      `
    };
    
    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'Test email sent successfully',
      recipient: recipient
    });
    
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      error: 'Failed to send test email',
      details: error.message 
    });
  }
});

// Helper functions

function createEmailBody(reportData, customMessage) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { background-color: #f4f4f4; padding: 20px; text-align: center; }
        .content { padding: 20px; }
        .summary { background-color: #e9ecef; padding: 15px; margin: 20px 0; border-radius: 5px; }
        .footer { background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>Contract Analysis Report</h1>
        <h2>${reportData.title || 'Invoice Analysis'}</h2>
      </div>
      
      <div class="content">
        ${customMessage ? `<p>${customMessage}</p>` : ''}
        
        <div class="summary">
          <h3>Report Summary</h3>
          <ul>
            <li><strong>Generated:</strong> ${new Date(reportData.generatedAt).toLocaleString()}</li>
            ${reportData.data?.summary ? `
              <li><strong>Total Invoices:</strong> ${reportData.data.summary.totalInvoices}</li>
              <li><strong>Total Value:</strong> $${reportData.data.summary.totalValue.toLocaleString()}</li>
              <li><strong>Average Value:</strong> $${reportData.data.summary.averageValue.toLocaleString()}</li>
            ` : ''}
          </ul>
        </div>
        
        <p>Please find the detailed report attached to this email.</p>
        
        <p>For questions or additional analysis, please contact the Contract Specialist team.</p>
      </div>
      
      <div class="footer">
        <p>This email was automatically generated by the Invoice Analytics Application.</p>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </div>
    </body>
    </html>
  `;
}

async function generateReportFile(reportData, reportId, format) {
  // This would use the same report generation logic from the reports route
  // For brevity, I'm referencing the functions that would be imported
  const reportsModule = require('./reports');
  
  switch (format.toLowerCase()) {
    case 'pdf':
      return await reportsModule.generatePDFReport(reportData, reportId);
    case 'excel':
    case 'xlsx':
      return await reportsModule.generateExcelReport(reportData, reportId);
    case 'csv':
      return await reportsModule.generateCSVReport(reportData, reportId);
    default:
      throw new Error('Unsupported format');
  }
}

function getContentType(format) {
  switch (format.toLowerCase()) {
    case 'pdf':
      return 'application/pdf';
    case 'excel':
    case 'xlsx':
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    case 'csv':
      return 'text/csv';
    default:
      return 'application/octet-stream';
  }
}

function calculateNextRun(schedule) {
  const now = new Date();
  const [hours, minutes] = schedule.time.split(':').map(Number);
  
  let nextRun = new Date();
  nextRun.setHours(hours, minutes, 0, 0);
  
  switch (schedule.frequency) {
    case 'daily':
      if (nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 1);
      }
      break;
      
    case 'weekly':
      const dayOfWeek = schedule.dayOfWeek || 1; // Default to Monday
      const daysUntilNext = (dayOfWeek - nextRun.getDay() + 7) % 7;
      if (daysUntilNext === 0 && nextRun <= now) {
        nextRun.setDate(nextRun.getDate() + 7);
      } else {
        nextRun.setDate(nextRun.getDate() + daysUntilNext);
      }
      break;
      
    case 'monthly':
      const dayOfMonth = schedule.dayOfMonth || 1;
      nextRun.setDate(dayOfMonth);
      if (nextRun <= now) {
        nextRun.setMonth(nextRun.getMonth() + 1);
      }
      break;
  }
  
  return nextRun.toISOString();
}

module.exports = router;
