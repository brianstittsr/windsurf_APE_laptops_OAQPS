const { db } = require('../config/firebase');
const { v4: uuidv4 } = require('uuid');

class Invoice {
  constructor(data) {
    this.id = data.id || uuidv4();
    this.contractInfo = data.contractInfo || {};
    this.orderDetails = data.orderDetails || {};
    this.deliveryPerformance = data.deliveryPerformance || {};
    this.deliveryLocations = data.deliveryLocations || [];
    this.productDetails = data.productDetails || [];
    this.totalAwardAmount = data.totalAwardAmount || 0;
    this.contractAdministration = data.contractAdministration || {};
    this.contactInfo = data.contactInfo || {};
    this.contractClauses = data.contractClauses || [];
    this.fiscalYear = data.fiscalYear || new Date().getFullYear();
    this.uploadDate = data.uploadDate || new Date().toISOString();
    this.originalFiles = data.originalFiles || [];
    this.extractedText = data.extractedText || '';
    this.schema = data.schema || 'epa_laptop_contract';
    this.status = data.status || 'processed';
  }

  // Save invoice to Firestore
  async save() {
    try {
      const docRef = db.collection('invoices').doc(this.id);
      await docRef.set(this.toJSON());
      return this.id;
    } catch (error) {
      throw new Error(`Failed to save invoice: ${error.message}`);
    }
  }

  // Get invoice by ID
  static async getById(id) {
    try {
      const doc = await db.collection('invoices').doc(id).get();
      if (!doc.exists) {
        return null;
      }
      return new Invoice({ id: doc.id, ...doc.data() });
    } catch (error) {
      throw new Error(`Failed to get invoice: ${error.message}`);
    }
  }

  // Get all invoices with optional filters
  static async getAll(filters = {}) {
    try {
      let query = db.collection('invoices');

      // Apply filters
      if (filters.fiscalYear) {
        query = query.where('fiscalYear', '==', parseInt(filters.fiscalYear));
      }
      if (filters.schema) {
        query = query.where('schema', '==', filters.schema);
      }
      if (filters.startDate && filters.endDate) {
        query = query.where('uploadDate', '>=', filters.startDate)
                    .where('uploadDate', '<=', filters.endDate);
      }

      // Order by upload date (newest first)
      query = query.orderBy('uploadDate', 'desc');

      // Apply limit if specified
      if (filters.limit) {
        query = query.limit(parseInt(filters.limit));
      }

      const snapshot = await query.get();
      return snapshot.docs.map(doc => new Invoice({ id: doc.id, ...doc.data() }));
    } catch (error) {
      throw new Error(`Failed to get invoices: ${error.message}`);
    }
  }

  // Search invoices by text content
  static async search(searchTerm, filters = {}) {
    try {
      const invoices = await this.getAll(filters);
      
      // Simple text search - in production, consider using Algolia or similar
      return invoices.filter(invoice => {
        const searchableText = [
          invoice.extractedText,
          invoice.contractInfo.description,
          invoice.contactInfo.contractingOfficer,
          JSON.stringify(invoice.deliveryLocations),
          JSON.stringify(invoice.productDetails)
        ].join(' ').toLowerCase();
        
        return searchableText.includes(searchTerm.toLowerCase());
      });
    } catch (error) {
      throw new Error(`Failed to search invoices: ${error.message}`);
    }
  }

  // Get analytics data
  static async getAnalytics(filters = {}) {
    try {
      const invoices = await this.getAll(filters);
      
      const analytics = {
        totalInvoices: invoices.length,
        totalValue: invoices.reduce((sum, inv) => sum + (inv.totalAwardAmount || 0), 0),
        averageValue: 0,
        byFiscalYear: {},
        bySchema: {},
        byMonth: {},
        topProducts: {},
        topLocations: {}
      };

      if (analytics.totalInvoices > 0) {
        analytics.averageValue = analytics.totalValue / analytics.totalInvoices;
      }

      // Group by fiscal year
      invoices.forEach(invoice => {
        const fy = invoice.fiscalYear;
        if (!analytics.byFiscalYear[fy]) {
          analytics.byFiscalYear[fy] = { count: 0, value: 0 };
        }
        analytics.byFiscalYear[fy].count++;
        analytics.byFiscalYear[fy].value += invoice.totalAwardAmount || 0;

        // Group by schema
        const schema = invoice.schema;
        if (!analytics.bySchema[schema]) {
          analytics.bySchema[schema] = { count: 0, value: 0 };
        }
        analytics.bySchema[schema].count++;
        analytics.bySchema[schema].value += invoice.totalAwardAmount || 0;

        // Group by month
        const month = new Date(invoice.uploadDate).toISOString().substring(0, 7);
        if (!analytics.byMonth[month]) {
          analytics.byMonth[month] = { count: 0, value: 0 };
        }
        analytics.byMonth[month].count++;
        analytics.byMonth[month].value += invoice.totalAwardAmount || 0;

        // Count products
        invoice.productDetails.forEach(product => {
          const productName = product.name || product.description || 'Unknown';
          if (!analytics.topProducts[productName]) {
            analytics.topProducts[productName] = { count: 0, totalValue: 0 };
          }
          analytics.topProducts[productName].count += product.quantity || 1;
          analytics.topProducts[productName].totalValue += product.totalPrice || 0;
        });

        // Count locations
        invoice.deliveryLocations.forEach(location => {
          const locationName = location.name || location.region || 'Unknown';
          if (!analytics.topLocations[locationName]) {
            analytics.topLocations[locationName] = { count: 0, totalValue: 0 };
          }
          analytics.topLocations[locationName].count++;
          analytics.topLocations[locationName].totalValue += location.totalPrice || 0;
        });
      });

      return analytics;
    } catch (error) {
      throw new Error(`Failed to get analytics: ${error.message}`);
    }
  }

  // Update invoice
  async update(updates) {
    try {
      Object.assign(this, updates);
      await db.collection('invoices').doc(this.id).update(updates);
      return this;
    } catch (error) {
      throw new Error(`Failed to update invoice: ${error.message}`);
    }
  }

  // Delete invoice
  async delete() {
    try {
      await db.collection('invoices').doc(this.id).delete();
      return true;
    } catch (error) {
      throw new Error(`Failed to delete invoice: ${error.message}`);
    }
  }

  // Convert to JSON
  toJSON() {
    return {
      id: this.id,
      contractInfo: this.contractInfo,
      orderDetails: this.orderDetails,
      deliveryPerformance: this.deliveryPerformance,
      deliveryLocations: this.deliveryLocations,
      productDetails: this.productDetails,
      totalAwardAmount: this.totalAwardAmount,
      contractAdministration: this.contractAdministration,
      contactInfo: this.contactInfo,
      contractClauses: this.contractClauses,
      fiscalYear: this.fiscalYear,
      uploadDate: this.uploadDate,
      originalFiles: this.originalFiles,
      extractedText: this.extractedText,
      schema: this.schema,
      status: this.status
    };
  }
}

module.exports = Invoice;
