// Mock API service with localStorage persistence
import { mockApiResponses } from './mockData';
import localStorageService from './localStorageService';

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

class MockApiService {
  constructor() {
    this.useMockData = true;
  }

  async get(url) {
    await delay(500);

    if (url.includes('/api/invoices')) {
      const invoices = localStorageService.getInvoices();
      const limit = url.includes('limit=5') ? 5 : invoices.length;
      return {
        data: {
          success: true,
          count: invoices.length,
          data: invoices.slice(0, limit)
        }
      };
    }

    if (url.includes('/api/analytics/dashboard')) {
      const analytics = localStorageService.generateAnalytics();
      return { data: { success: true, data: analytics } };
    }

    if (url.includes('/api/chat/conversations')) {
      return { 
        data: { 
          success: true, 
          data: localStorageService.getConversations() 
        } 
      };
    }

    if (url.includes('/api/reports/history')) {
      return { 
        data: { 
          success: true, 
          data: localStorageService.getReports() 
        } 
      };
    }

    // Return mock responses for other endpoints
    const mockKey = Object.keys(mockApiResponses).find(key => url.includes(key.replace('/api', '')));
    if (mockKey) {
      return { data: mockApiResponses[mockKey] };
    }

    return { data: { success: false, error: 'Endpoint not found' } };
  }

  async post(url, data) {
    await delay(800);

    if (url.includes('/api/invoices/upload')) {
      localStorageService.logActivity({
        type: 'invoice_upload',
        description: `Uploaded invoice files`,
        details: { schema: data.schema }
      });

      const newInvoice = {
        contractInfo: {
          contractNumber: '68HERD24F' + Math.floor(Math.random() * 1000).toString().padStart(4, '0'),
          description: 'Uploaded Invoice - ' + new Date().toLocaleDateString()
        },
        totalAwardAmount: 1500000 + Math.random() * 1000000,
        fiscalYear: new Date().getFullYear(),
        schema: data.schema || 'epa_laptop_contract',
        status: 'processed',
        deliveryLocations: [
          { name: 'EPA R1 Main Location', region: 'R1', totalPrice: 150000, quantity: 85 }
        ],
        productDetails: [
          { name: 'Dell Latitude 5340 2-in-1', quantity: 85, unitPrice: 1650, totalPrice: 140250 }
        ]
      };

      const savedInvoice = localStorageService.addInvoice(newInvoice);
      return {
        data: {
          success: true,
          invoiceId: savedInvoice.id,
          message: 'Invoice uploaded and processed successfully',
          data: savedInvoice
        }
      };
    }

    if (url.includes('/api/chat/query')) {
      localStorageService.logActivity({
        type: 'chat_query',
        description: `AI chat query`,
        details: { query: data.message }
      });

      const analytics = localStorageService.generateAnalytics();
      const response = `Based on ${analytics.totalInvoices} invoices with total value $${analytics.totalValue.toLocaleString()}, here's the analysis for: "${data.message}"`;

      localStorageService.addConversation({
        message: data.message,
        response,
        context: { invoicesAnalyzed: analytics.totalInvoices, totalValue: analytics.totalValue }
      });

      return {
        data: {
          success: true,
          data: { response, conversationId: 'conv_' + Date.now() }
        }
      };
    }

    if (url.includes('/api/reports/generate')) {
      localStorageService.logActivity({
        type: 'report_generation',
        description: `Generated ${data.format} report: ${data.title}`
      });

      const analytics = localStorageService.generateAnalytics();
      const newReport = {
        title: data.title,
        format: data.format,
        invoicesIncluded: analytics.totalInvoices,
        totalValue: analytics.totalValue
      };

      const savedReport = localStorageService.addReport(newReport);
      return { data: { success: true, data: savedReport } };
    }

    return { data: { success: true, message: 'Operation completed' } };
  }

  async put(url, data) {
    await delay(500);
    return { data: { success: true, message: 'Updated successfully' } };
  }

  async delete(url) {
    await delay(300);
    return { data: { success: true, message: 'Deleted successfully' } };
  }
}

export default new MockApiService();
