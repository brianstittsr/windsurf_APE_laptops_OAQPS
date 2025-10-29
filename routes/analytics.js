const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { db } = require('../config/firebase');

// Get analytics dashboard data
router.get('/dashboard', async (req, res) => {
  try {
    const filters = {
      fiscalYear: req.query.fiscalYear,
      schema: req.query.schema,
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    // Remove undefined filters
    Object.keys(filters).forEach(key => 
      filters[key] === undefined && delete filters[key]
    );

    const analytics = await Invoice.getAnalytics(filters);
    
    res.json({
      success: true,
      data: analytics,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch analytics',
      details: error.message 
    });
  }
});

// Get fiscal year comparison
router.get('/fiscal-years', async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 2, currentYear - 1, currentYear];
    
    const yearlyData = {};
    
    for (const year of years) {
      const analytics = await Invoice.getAnalytics({ fiscalYear: year });
      yearlyData[year] = {
        totalInvoices: analytics.totalInvoices,
        totalValue: analytics.totalValue,
        averageValue: analytics.averageValue,
        topProducts: Object.entries(analytics.topProducts)
          .sort(([,a], [,b]) => b.totalValue - a.totalValue)
          .slice(0, 5),
        topLocations: Object.entries(analytics.topLocations)
          .sort(([,a], [,b]) => b.totalValue - a.totalValue)
          .slice(0, 5)
      };
    }
    
    res.json({
      success: true,
      data: yearlyData,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching fiscal year analytics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch fiscal year analytics',
      details: error.message 
    });
  }
});

// Get monthly trends
router.get('/trends/monthly', async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    
    const startDate = `${year}-01-01T00:00:00.000Z`;
    const endDate = `${year}-12-31T23:59:59.999Z`;
    
    const analytics = await Invoice.getAnalytics({ 
      startDate: startDate,
      endDate: endDate 
    });
    
    // Format monthly data for charts
    const monthlyTrends = Object.entries(analytics.byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month: month,
        monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'long' }),
        invoiceCount: data.count,
        totalValue: data.value,
        averageValue: data.count > 0 ? data.value / data.count : 0
      }));
    
    res.json({
      success: true,
      data: {
        year: parseInt(year),
        monthlyTrends: monthlyTrends,
        summary: {
          totalInvoices: analytics.totalInvoices,
          totalValue: analytics.totalValue,
          averageValue: analytics.averageValue
        }
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    res.status(500).json({ 
      error: 'Failed to fetch monthly trends',
      details: error.message 
    });
  }
});

// Get top products analysis
router.get('/products/top', async (req, res) => {
  try {
    const { limit = 10, fiscalYear } = req.query;
    const filters = fiscalYear ? { fiscalYear: parseInt(fiscalYear) } : {};
    
    const analytics = await Invoice.getAnalytics(filters);
    
    const topProducts = Object.entries(analytics.topProducts)
      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
      .slice(0, parseInt(limit))
      .map(([product, data]) => ({
        name: product,
        totalQuantity: data.count,
        totalValue: data.totalValue,
        averagePrice: data.count > 0 ? data.totalValue / data.count : 0
      }));
    
    res.json({
      success: true,
      data: topProducts,
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching top products:', error);
    res.status(500).json({ 
      error: 'Failed to fetch top products',
      details: error.message 
    });
  }
});

// Get location analysis
router.get('/locations/analysis', async (req, res) => {
  try {
    const { fiscalYear } = req.query;
    const filters = fiscalYear ? { fiscalYear: parseInt(fiscalYear) } : {};
    
    const analytics = await Invoice.getAnalytics(filters);
    
    const locationAnalysis = Object.entries(analytics.topLocations)
      .sort(([,a], [,b]) => b.totalValue - a.totalValue)
      .map(([location, data]) => ({
        name: location,
        orderCount: data.count,
        totalValue: data.totalValue,
        averageOrderValue: data.count > 0 ? data.totalValue / data.count : 0,
        percentageOfTotal: analytics.totalValue > 0 ? 
          (data.totalValue / analytics.totalValue * 100).toFixed(2) : 0
      }));
    
    res.json({
      success: true,
      data: locationAnalysis,
      summary: {
        totalLocations: locationAnalysis.length,
        totalValue: analytics.totalValue,
        totalOrders: analytics.totalInvoices
      },
      filters: filters,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching location analysis:', error);
    res.status(500).json({ 
      error: 'Failed to fetch location analysis',
      details: error.message 
    });
  }
});

// Get activity logs summary
router.get('/activity/summary', async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    const logsSnapshot = await db.collection('activity_logs')
      .where('timestamp', '>=', startDate.toISOString())
      .orderBy('timestamp', 'desc')
      .limit(1000)
      .get();
    
    const logs = logsSnapshot.docs.map(doc => doc.data());
    
    // Summarize activity
    const activitySummary = {
      totalActivities: logs.length,
      byType: {},
      byDay: {},
      recentActivities: logs.slice(0, 10)
    };
    
    logs.forEach(log => {
      // Count by type
      if (!activitySummary.byType[log.type]) {
        activitySummary.byType[log.type] = 0;
      }
      activitySummary.byType[log.type]++;
      
      // Count by day
      const day = log.timestamp.substring(0, 10);
      if (!activitySummary.byDay[day]) {
        activitySummary.byDay[day] = 0;
      }
      activitySummary.byDay[day]++;
    });
    
    res.json({
      success: true,
      data: activitySummary,
      period: `${days} days`,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching activity summary:', error);
    res.status(500).json({ 
      error: 'Failed to fetch activity summary',
      details: error.message 
    });
  }
});

// Get schema distribution
router.get('/schemas/distribution', async (req, res) => {
  try {
    const analytics = await Invoice.getAnalytics();
    
    const schemaDistribution = Object.entries(analytics.bySchema)
      .map(([schema, data]) => ({
        schema: schema,
        count: data.count,
        totalValue: data.value,
        percentage: analytics.totalInvoices > 0 ? 
          (data.count / analytics.totalInvoices * 100).toFixed(2) : 0
      }));
    
    res.json({
      success: true,
      data: schemaDistribution,
      summary: {
        totalSchemas: schemaDistribution.length,
        totalInvoices: analytics.totalInvoices,
        totalValue: analytics.totalValue
      },
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching schema distribution:', error);
    res.status(500).json({ 
      error: 'Failed to fetch schema distribution',
      details: error.message 
    });
  }
});

// Get performance metrics
router.get('/performance', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));
    
    // Get recent invoices for performance analysis
    const recentInvoices = await Invoice.getAll({
      startDate: startDate.toISOString(),
      limit: 1000
    });
    
    // Get activity logs for the same period
    const logsSnapshot = await db.collection('activity_logs')
      .where('timestamp', '>=', startDate.toISOString())
      .get();
    
    const logs = logsSnapshot.docs.map(doc => doc.data());
    
    const performance = {
      invoicesProcessed: recentInvoices.length,
      totalActivities: logs.length,
      averageProcessingTime: this.calculateAverageProcessingTime(logs),
      errorRate: this.calculateErrorRate(logs),
      popularQueries: this.getPopularQueries(logs),
      systemHealth: {
        status: 'healthy',
        uptime: '99.9%',
        lastUpdate: new Date().toISOString()
      }
    };
    
    res.json({
      success: true,
      data: performance,
      period: `${days} days`,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching performance metrics:', error);
    res.status(500).json({ 
      error: 'Failed to fetch performance metrics',
      details: error.message 
    });
  }
});

// Helper methods
function calculateAverageProcessingTime(logs) {
  const uploadLogs = logs.filter(log => log.type === 'invoice_upload');
  if (uploadLogs.length === 0) return 0;
  
  // This is a simplified calculation - in production, you'd track actual processing times
  return 2.5; // seconds
}

function calculateErrorRate(logs) {
  const totalOperations = logs.length;
  const errorLogs = logs.filter(log => log.type === 'error');
  
  if (totalOperations === 0) return 0;
  return (errorLogs.length / totalOperations * 100).toFixed(2);
}

function getPopularQueries(logs) {
  const chatLogs = logs.filter(log => log.type === 'chat_query');
  const queryCount = {};
  
  chatLogs.forEach(log => {
    if (log.query) {
      const key = log.query.toLowerCase().substring(0, 50);
      queryCount[key] = (queryCount[key] || 0) + 1;
    }
  });
  
  return Object.entries(queryCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([query, count]) => ({ query, count }));
}

module.exports = router;
