const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');
const { db } = require('../config/firebase');

// Initialize OpenAI (optional)
let openai = null;
if (process.env.OPENAI_API_KEY) {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    console.log('OpenAI initialized successfully');
  } catch (error) {
    console.log('OpenAI initialization failed:', error.message);
  }
} else {
  console.log('OpenAI API key not found, OpenAI features disabled');
}

// Initialize Anthropic (optional)
const anthropic = process.env.ANTHROPIC_API_KEY ? {
  apiKey: process.env.ANTHROPIC_API_KEY,
  baseURL: 'https://api.anthropic.com'
} : null;

if (anthropic) {
  console.log('Anthropic configuration ready');
} else {
  console.log('Anthropic API key not found, Anthropic features disabled');
}

// Chat with invoice data (legacy route - Firebase required)
router.post('/query', async (req, res) => {
  try {
    if (!db) {
      return res.status(503).json({ 
        error: 'Database not available. Use /ai-proxy endpoint instead.',
        suggestion: 'This route requires Firebase. Use the /ai-proxy endpoint for AI functionality.'
      });
    }

    if (!openai) {
      return res.status(503).json({ 
        error: 'OpenAI not available. Use /ai-proxy endpoint instead.',
        suggestion: 'This route requires OpenAI. Use the /ai-proxy endpoint for AI functionality.'
      });
    }

    const { message, context = {}, conversationId } = req.body;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Get relevant invoice data based on context
    const invoiceData = await getRelevantInvoiceData(message, context);
    
    // Create system prompt with invoice data context
    const systemPrompt = createSystemPrompt(invoiceData);
    
    // Generate response using OpenAI
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message }
      ],
      max_tokens: 1000,
      temperature: 0.3
    });

    const response = completion.choices[0].message.content;
    
    // Save conversation to database
    const conversationData = {
      id: conversationId || generateConversationId(),
      message: message,
      response: response,
      context: context,
      invoiceDataUsed: invoiceData.summary,
      timestamp: new Date().toISOString(),
      tokenUsage: completion.usage
    };
    
    await db.collection('chat_conversations').add(conversationData);
    
    // Log the query activity
    await db.collection('activity_logs').add({
      type: 'chat_query',
      query: message,
      responseLength: response.length,
      invoicesQueried: invoiceData.invoices.length,
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: {
        response: response,
        conversationId: conversationData.id,
        context: {
          invoicesAnalyzed: invoiceData.invoices.length,
          totalValue: invoiceData.summary.totalValue,
          fiscalYears: invoiceData.summary.fiscalYears
        }
      }
    });

  } catch (error) {
    console.error('Error processing chat query:', error);
    
    // Log error
    await db.collection('activity_logs').add({
      type: 'error',
      operation: 'chat_query',
      error: error.message,
      timestamp: new Date().toISOString()
    });

    res.status(500).json({ 
      error: 'Failed to process chat query',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Get conversation history
router.get('/conversations', async (req, res) => {
  try {
    const { limit = 50, conversationId } = req.query;
    
    let query = db.collection('chat_conversations')
      .orderBy('timestamp', 'desc');
    
    if (conversationId) {
      query = query.where('id', '==', conversationId);
    }
    
    query = query.limit(parseInt(limit));
    
    const snapshot = await query.get();
    const conversations = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: conversations,
      count: conversations.length
    });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch conversations',
      details: error.message 
    });
  }
});

// Get suggested queries based on data
router.get('/suggestions', async (req, res) => {
  try {
    const analytics = await Invoice.getAnalytics();
    
    const suggestions = [
      "What is the total value of contracts for the past 3 fiscal years?",
      "Show me the top 5 products by total value",
      "Which EPA regions have the highest contract values?",
      "What is the average contract value by fiscal year?",
      "List all Dell laptop orders from the past year",
      "Compare contract values between FY2023 and FY2024",
      "What are the delivery timelines for recent contracts?",
      "Show me contracts over $200,000",
      "Which contracting officers handle the most orders?",
      "What is the breakdown of orders by EPA region?"
    ];
    
    // Add dynamic suggestions based on actual data
    const dynamicSuggestions = [];
    
    if (analytics.totalInvoices > 0) {
      dynamicSuggestions.push(
        `Analyze the ${analytics.totalInvoices} invoices in the system`,
        `What is the total value of $${analytics.totalValue.toLocaleString()}?`
      );
    }
    
    const fiscalYears = Object.keys(analytics.byFiscalYear);
    if (fiscalYears.length > 1) {
      dynamicSuggestions.push(
        `Compare fiscal years ${fiscalYears.join(', ')}`
      );
    }
    
    const topProducts = Object.keys(analytics.topProducts).slice(0, 3);
    if (topProducts.length > 0) {
      dynamicSuggestions.push(
        `Tell me about ${topProducts.join(', ')} orders`
      );
    }
    
    res.json({
      success: true,
      data: {
        general: suggestions,
        dynamic: dynamicSuggestions,
        analytics: {
          totalInvoices: analytics.totalInvoices,
          totalValue: analytics.totalValue,
          fiscalYears: fiscalYears
        }
      }
    });
  } catch (error) {
    console.error('Error fetching suggestions:', error);
    res.status(500).json({ 
      error: 'Failed to fetch suggestions',
      details: error.message 
    });
  }
});

// Generate report from chat query
router.post('/generate-report', async (req, res) => {
  try {
    const { query, format = 'pdf', email } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }
    
    // Get relevant data for the query
    const invoiceData = await getRelevantInvoiceData(query);
    
    // Generate report content using AI
    const reportPrompt = `
      Based on the following query: "${query}"
      
      Generate a detailed report using this invoice data:
      ${JSON.stringify(invoiceData.summary, null, 2)}
      
      The report should include:
      1. Executive Summary
      2. Key Findings
      3. Data Analysis
      4. Recommendations (if applicable)
      5. Supporting Data Tables
      
      Format the response as structured data that can be converted to ${format.toUpperCase()}.
    `;
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a contracts analysis expert. Generate detailed, professional reports." },
        { role: "user", content: reportPrompt }
      ],
      max_tokens: 2000,
      temperature: 0.2
    });
    
    const reportContent = completion.choices[0].message.content;
    
    // Save report request
    const reportData = {
      query: query,
      content: reportContent,
      format: format,
      invoiceDataUsed: invoiceData.summary,
      requestedAt: new Date().toISOString(),
      status: 'generated'
    };
    
    const reportRef = await db.collection('generated_reports').add(reportData);
    
    // Log report generation
    await db.collection('activity_logs').add({
      type: 'report_generation',
      query: query,
      format: format,
      reportId: reportRef.id,
      timestamp: new Date().toISOString()
    });
    
    res.json({
      success: true,
      data: {
        reportId: reportRef.id,
        content: reportContent,
        format: format,
        generatedAt: new Date().toISOString(),
        downloadUrl: `/api/reports/download/${reportRef.id}`,
        invoicesAnalyzed: invoiceData.invoices.length
      }
    });
    
  } catch (error) {
    console.error('Error generating report:', error);
    res.status(500).json({ 
      error: 'Failed to generate report',
      details: error.message 
    });
  }
});

// Helper functions
async function getRelevantInvoiceData(query, context = {}) {
  try {
    // Determine filters based on query content
    const filters = {};
    
    // Extract fiscal year from query
    const fyMatch = query.match(/(?:FY|fiscal year)\s*(\d{2,4})/i);
    if (fyMatch) {
      let year = parseInt(fyMatch[1]);
      if (year < 100) year += 2000;
      filters.fiscalYear = year;
    }
    
    // Extract date range
    const currentYear = new Date().getFullYear();
    if (query.includes('past 3 years') || query.includes('last 3 years')) {
      filters.startDate = `${currentYear - 2}-01-01T00:00:00.000Z`;
    } else if (query.includes('past year') || query.includes('last year')) {
      filters.startDate = `${currentYear - 1}-01-01T00:00:00.000Z`;
    }
    
    // Apply context filters
    Object.assign(filters, context);
    
    // Get invoices
    const invoices = await Invoice.getAll(filters);
    
    // Create summary
    const summary = {
      totalInvoices: invoices.length,
      totalValue: invoices.reduce((sum, inv) => sum + (inv.totalAwardAmount || 0), 0),
      fiscalYears: [...new Set(invoices.map(inv => inv.fiscalYear))].sort(),
      schemas: [...new Set(invoices.map(inv => inv.schema))],
      dateRange: {
        earliest: invoices.length > 0 ? Math.min(...invoices.map(inv => new Date(inv.uploadDate))) : null,
        latest: invoices.length > 0 ? Math.max(...invoices.map(inv => new Date(inv.uploadDate))) : null
      }
    };
    
    return {
      invoices: invoices,
      summary: summary,
      filters: filters
    };
  } catch (error) {
    console.error('Error getting relevant invoice data:', error);
    return {
      invoices: [],
      summary: { totalInvoices: 0, totalValue: 0, fiscalYears: [], schemas: [] },
      filters: {}
    };
  }
}

function createSystemPrompt(invoiceData) {
  return `
You are an AI assistant specialized in analyzing EPA contract and invoice data for Contract Specialists.

You have access to the following invoice data:
- Total Invoices: ${invoiceData.summary.totalInvoices}
- Total Value: $${invoiceData.summary.totalValue.toLocaleString()}
- Fiscal Years: ${invoiceData.summary.fiscalYears.join(', ')}
- Document Types: ${invoiceData.summary.schemas.join(', ')}

Key capabilities:
1. Answer questions about contract values, trends, and comparisons
2. Provide analysis of spending patterns by fiscal year
3. Identify top products, vendors, and delivery locations
4. Generate insights for management reporting
5. Help with compliance and audit questions

Guidelines:
- Provide accurate, data-driven responses
- Use specific numbers and percentages when available
- Explain calculations and methodology
- Suggest follow-up questions or additional analysis
- Format responses clearly with bullet points or tables when appropriate
- If data is insufficient, clearly state limitations

Always base your responses on the actual data provided and be transparent about any assumptions or limitations.
`;
}

function generateConversationId() {
  return 'conv_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// AI Proxy route for client-side AI service
router.post('/ai-proxy', async (req, res) => {
  try {
    console.log('AI Proxy request received:', {
      provider: req.body.provider,
      model: req.body.model,
      hasApiKey: !!req.body.apiKey,
      hasMessage: !!req.body.message,
      hasSystemPrompt: !!req.body.systemPrompt
    });

    console.log('DEBUG: About to process provider:', req.body.provider);

    const { provider, model, apiKey, message, systemPrompt, temperature = 0.3, maxTokens = 2000 } = req.body;
    
    if (!provider || !model || !apiKey || !message) {
      console.log('Missing required parameters:', { provider, model, hasApiKey: !!apiKey, hasMessage: !!message });
      return res.status(400).json({ 
        error: 'Missing required parameters',
        required: ['provider', 'model', 'apiKey', 'message'],
        received: { provider: !!provider, model: !!model, apiKey: !!apiKey, message: !!message }
      });
    }

    let response;

    if (provider === 'anthropic') {
      // Handle Anthropic API call
      console.log('Making Anthropic API call...');
      console.log('API Key length:', apiKey ? apiKey.length : 0);
      console.log('Model:', model);
      console.log('Message length:', message ? message.length : 0);
      
      const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: [
            { role: 'user', content: message }
          ],
          temperature: temperature
        })
      });

      console.log('Anthropic response status:', anthropicResponse.status);
      
      if (!anthropicResponse.ok) {
        const errorData = await anthropicResponse.json();
        console.log('Anthropic error:', errorData);
        return res.status(anthropicResponse.status).json({ error: errorData });
      }

      const data = await anthropicResponse.json();
      console.log('Anthropic response received successfully');
      response = data.content[0].text;

    } else if (provider === 'openai' || provider === 'ollama') {
      // Handle OpenAI API call
      if (!apiKey) {
        return res.status(400).json({ error: 'OpenAI API key is required' });
      }
      
      const openaiClient = new OpenAI({ apiKey: apiKey });
      
      const completion = await openaiClient.chat.completions.create({
        model: model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: temperature,
        max_tokens: maxTokens
      });

      response = completion.choices[0].message.content;

    } else {
      return res.status(400).json({ error: 'Unsupported provider' });
    }

    res.json({ 
      success: true, 
      response: response,
      provider: provider,
      model: model 
    });

  } catch (error) {
    console.error('AI Proxy Error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: 'AI service error', 
      details: error.message 
    });
  }
});

// AI Connection Test Proxy
router.post('/ai-proxy/test', async (req, res) => {
  try {
    const { provider, model, apiKey, endpoint } = req.body;

    if (!provider || !apiKey || !model) {
      return res.status(400).json({ error: 'Missing required parameters for test' });
    }

    let testResponse;
    if (provider === 'anthropic') {
      testResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: model,
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Hello' }]
        })
      });
    } else { // Assuming OpenAI, Ollama, or compatible
      const testEndpoint = endpoint || 'https://api.openai.com/v1/chat/completions';
      testResponse = await fetch(testEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [{ role: 'user', content: 'Hello' }],
          max_tokens: 10
        })
      });
    }

    if (testResponse.ok) {
      res.json({ success: true });
    } else {
      const errorData = await testResponse.json();
      res.status(testResponse.status).json({ success: false, error: errorData.error?.message || `HTTP ${testResponse.status}` });
    }
  } catch (error) {
    console.error('AI Connection Test Proxy Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Data API Connection Test Proxy
router.post('/data-api/test', async (req, res) => {
  try {
    const { api, airnow, aqsEmail, aqsKey } = req.body;

    if (api === 'airnow') {
      if (!airnow) return res.status(400).json({ error: 'AirNow API key is required' });
      const testUrl = `https://www.airnowapi.org/aq/observation/zipCode/current/?format=application/json&zipCode=20002&distance=25&API_KEY=${airnow}`;
      const response = await fetch(testUrl);
      if (response.ok) {
        res.json({ success: true });
      } else {
        res.status(response.status).json({ success: false, error: `HTTP ${response.status}` });
      }
    } else if (api === 'aqs') {
      if (!aqsEmail || !aqsKey) return res.status(400).json({ error: 'AQS email and key are required' });
      const testUrl = `https://aqs.epa.gov/data/api/list/states?email=${aqsEmail}&key=${aqsKey}`;
      const response = await fetch(testUrl);
      if (response.ok) {
        res.json({ success: true });
      } else {
        const errorData = await response.json();
        res.status(response.status).json({ success: false, error: errorData.Header?.message || `HTTP ${response.status}` });
      }
    } else {
      res.status(400).json({ error: 'Invalid API specified' });
    }
  } catch (error) {
    console.error('Data API Connection Test Proxy Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Log OID Director Questions
router.post('/log-question', (req, res) => {
  const { question } = req.body;
  if (!question) {
    return res.status(400).json({ error: 'Question is required' });
  }

  const logFilePath = path.join(__dirname, '..', 'logs', 'oid_director_questions.md');
  const logEntry = `## Question asked on ${new Date().toISOString()}\n\n- ${question}\n\n---\n\n`;

  fs.appendFile(logFilePath, logEntry, (err) => {
    if (err) {
      console.error('Failed to log question:', err);
      return res.status(500).json({ error: 'Failed to log question' });
    }
    res.status(200).json({ success: true });
  });
});

module.exports = router;
