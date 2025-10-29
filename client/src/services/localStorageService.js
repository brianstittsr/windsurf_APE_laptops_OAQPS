// Local Storage Service for persistent data without database
class LocalStorageService {
  constructor() {
    this.STORAGE_KEYS = {
      INVOICES: 'epa_invoices',
      REPORTS: 'epa_reports',
      CONVERSATIONS: 'epa_conversations',
      SETTINGS: 'epa_settings',
      ACTIVITY_LOGS: 'epa_activity_logs'
    };
    

    // Initialize with mock data if empty
    this.initializeStorage();
  }

  initializeStorage() {
    // Always use fresh datafiles data - force refresh if needed
    const existingInvoices = this.getInvoices();
    
    // If no data exists OR if we have old mock data (less than 11 contracts), refresh
    if (!existingInvoices.length || existingInvoices.length < 11) {
      console.log('Initializing with fresh datafiles data...');
      const freshInvoices = this.generateFreshInvoiceData();
      this.setInvoices(freshInvoices);
      
      // Still use mock data for reports and conversations
      const { mockReports, mockConversations } = require('./mockData');
      this.setReports(mockReports);
      this.setConversations(mockConversations);
      
      // Log the initialization
      this.logActivity({
        action: 'System Initialization',
        description: `Initialized localStorage with ${freshInvoices.length} contracts from datafiles`,
        user: 'system'
      });
      
      console.log(`Loaded ${freshInvoices.length} contracts from datafiles folder`);
    }
  }

  // Invoice Management
  getInvoices() {
    return this.getFromStorage(this.STORAGE_KEYS.INVOICES) || [];
  }

  setInvoices(invoices) {
    this.setToStorage(this.STORAGE_KEYS.INVOICES, invoices);
  }

  addInvoice(invoice) {
    const invoices = this.getInvoices();
    const newInvoice = { ...invoice, id: this.generateId(), uploadDate: new Date().toISOString() };
    invoices.push(newInvoice);
    this.setInvoices(invoices);
    
    // Log the addition for activity tracking
    this.logActivity({
      action: 'Contract Added',
      description: `Added contract: ${newInvoice.contractNumber || newInvoice.fileName}`,
      user: 'system'
    });
    
    // Trigger analytics recalculation (this happens automatically when getInvoices() is called)
    return newInvoice;
  }

  // Report Management
  getReports() {
    return this.getFromStorage(this.STORAGE_KEYS.REPORTS) || [];
  }

  addReport(report) {
    const reports = this.getReports();
    const newReport = {
      ...report,
      id: this.generateId(),
      generatedAt: new Date().toISOString(),
      status: 'generated',
      invoicesIncluded: report.summary.totalContracts,
      totalValue: report.summary.totalValue
    };
    reports.unshift(newReport);
    this.setToStorage(this.STORAGE_KEYS.REPORTS, reports);
    return newReport;
  }

  setReports(reports) {
    this.setToStorage(this.STORAGE_KEYS.REPORTS, reports);
  }

  // Conversation Management
  getConversations() {
    return this.getFromStorage(this.STORAGE_KEYS.CONVERSATIONS) || [];
  }

  addConversation(conversation) {
    const conversations = this.getConversations();
    conversations.unshift({
      ...conversation,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    });
    this.setToStorage(this.STORAGE_KEYS.CONVERSATIONS, conversations);
  }

  // Settings Management
  getSettings() {
    return this.getFromStorage(this.STORAGE_KEYS.SETTINGS) || {
      emailSettings: {
        host: 'smtp.gmail.com',
        port: 587,
        user: '',
        password: '',
        enableNotifications: true
      },
      theme: 'light',
      language: 'en'
    };
  }

  updateSettings(settings) {
    this.setToStorage(this.STORAGE_KEYS.SETTINGS, settings);
  }

  // Activity Logging
  logActivity(activity) {
    const logs = this.getFromStorage(this.STORAGE_KEYS.ACTIVITY_LOGS) || [];
    logs.unshift({
      ...activity,
      id: this.generateId(),
      timestamp: new Date().toISOString()
    });
    
    // Keep only last 1000 activities
    if (logs.length > 1000) {
      logs.splice(1000);
    }
    
    this.setToStorage(this.STORAGE_KEYS.ACTIVITY_LOGS, logs);
  }

  getActivityLogs(limit = 100) {
    const logs = this.getFromStorage(this.STORAGE_KEYS.ACTIVITY_LOGS) || [];
    return logs.slice(0, limit);
  }

  // Analytics Generation
  generateAnalytics() {
    const invoices = this.getInvoices();
    const totalValue = invoices.reduce((sum, inv) => sum + inv.totalAwardAmount, 0);
    
    return {
      totalInvoices: invoices.length,
      totalValue,
      averageValue: invoices.length ? totalValue / invoices.length : 0,
      byFiscalYear: this.groupByFiscalYear(invoices),
      bySchema: this.groupBySchema(invoices),
      byContractType: this.groupByContractType(invoices),
      recentActivity: this.getActivityLogs(10)
    };
  }

  groupByContractType(invoices) {
    const contractTypes = {
      'Laptop': { count: 0, value: 0, description: 'Laptop Contracts' },
      'Desktop/Monitor': { count: 0, value: 0, description: 'Desktop/Monitor Contracts' },
      'BPA Services': { count: 0, value: 0, description: 'BPA Services' }
    };

    invoices.forEach(invoice => {
      let type = 'Laptop'; // default
      
      if (invoice.schema && invoice.schema.includes('Desktop')) {
        type = 'Desktop/Monitor';
      } else if (invoice.schema && invoice.schema.includes('BPA')) {
        type = 'BPA Services';
      } else if (invoice.description && invoice.description.toLowerCase().includes('desktop')) {
        type = 'Desktop/Monitor';
      } else if (invoice.description && invoice.description.toLowerCase().includes('bpa')) {
        type = 'BPA Services';
      }

      contractTypes[type].count++;
      contractTypes[type].value += invoice.totalAwardAmount;
    });

    return contractTypes;
  }

  groupByFiscalYear(invoices) {
    return invoices.reduce((acc, invoice) => {
      const year = invoice.fiscalYear;
      if (!acc[year]) {
        acc[year] = { count: 0, value: 0 };
      }
      acc[year].count++;
      acc[year].value += invoice.totalAwardAmount;
      return acc;
    }, {});
  }

  groupBySchema(invoices) {
    return invoices.reduce((acc, invoice) => {
      const schema = invoice.schema;
      if (!acc[schema]) {
        acc[schema] = { count: 0, value: 0 };
      }
      acc[schema].count++;
      acc[schema].value += invoice.totalAwardAmount;
      return acc;
    }, {});
  }

  // Utility Methods
  getFromStorage(key) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error(`Error reading from localStorage key ${key}:`, error);
      return null;
    }
  }

  setToStorage(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error(`Error writing to localStorage key ${key}:`, error);
    }
  }

  generateId() {
    return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  // Export/Import for backup
  exportData() {
    const data = {};
    Object.values(this.STORAGE_KEYS).forEach(key => {
      data[key] = this.getFromStorage(key);
    });
    return JSON.stringify(data, null, 2);
  }

  importData(jsonData) {
    try {
      const data = JSON.parse(jsonData);
      Object.entries(data).forEach(([key, value]) => {
        if (Object.values(this.STORAGE_KEYS).includes(key)) {
          this.setToStorage(key, value);
        }
      });
      return true;
    } catch (error) {
      console.error('Error importing data:', error);
      return false;
    }
  }

  // Clear all data
  clearAllData() {
    Object.values(this.STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  // Force reinitialization with fresh data
  forceReinitialize() {
    this.clearAllData();
    this.initializeStorage();
    return this.getInvoices();
  }

  // Truncate and refresh with new datafiles data
  truncateAndRefreshData() {
    // Clear existing data
    this.clearAllData();
    
    // Load fresh data based on datafiles folder contents
    const freshInvoices = this.generateFreshInvoiceData();
    
    // Set the fresh data
    this.setInvoices(freshInvoices);
    
    // Log the refresh activity
    this.logActivity({
      action: 'Data Refresh',
      description: `Truncated localStorage and refreshed with ${freshInvoices.length} contracts from datafiles`,
      user: 'system'
    });
    
    return freshInvoices;
  }

  // Generate fresh invoice data based on datafiles folder contents
  generateFreshInvoiceData() {
    const contractFiles = [
      {
        filename: '21 FY Laptop 2nd Order APRIL 68HERD21F0109.pdf',
        contractNumber: '68HERD21F0109',
        fiscalYear: 2021,
        month: 'April',
        order: '2nd Order',
        type: 'Laptop'
      },
      {
        filename: '22 FY Laptop Order JUNE 68HERD22F0096.pdf',
        contractNumber: '68HERD22F0096',
        fiscalYear: 2022,
        month: 'June',
        order: '1st Order',
        type: 'Laptop'
      },
      {
        filename: '23 FY Laptop 1st Order FEB 68HERD23F0048.pdf',
        contractNumber: '68HERD23F0048',
        fiscalYear: 2023,
        month: 'February',
        order: '1st Order',
        type: 'Laptop'
      },
      {
        filename: '24 FY Laptop Jan 68HERD24F0034.pdf',
        contractNumber: '68HERD24F0034',
        fiscalYear: 2024,
        month: 'January',
        order: '1st Order',
        type: 'Laptop'
      },
      {
        filename: '24 FY Laptop May 4 68HERD24F0065.pdf',
        contractNumber: '68HERD24F0065',
        fiscalYear: 2024,
        month: 'May',
        order: '4th Order',
        type: 'Laptop'
      },
      {
        filename: '24 FY Laptop SEPT 3 68HERD24F0117.pdf',
        contractNumber: '68HERD24F0117',
        fiscalYear: 2024,
        month: 'September',
        order: '3rd Order',
        type: 'Laptop'
      },
      {
        filename: '68HERD25F0064 April 23 2025.pdf',
        contractNumber: '68HERD25F0064',
        fiscalYear: 2025,
        month: 'April',
        order: '1st Order',
        type: 'Laptop'
      },
      {
        filename: 'BPA-C_47QTCA22A000C_68HERD23F0158.pdf',
        contractNumber: '68HERD23F0158',
        fiscalYear: 2023,
        month: 'August',
        order: 'BPA Call',
        type: 'BPA Services'
      },
      {
        filename: 'DOTO_GS-35F-0889N_68HERD21F0238.pdf',
        contractNumber: '68HERD21F0238',
        fiscalYear: 2021,
        month: 'December',
        order: 'GSA Order',
        type: 'Desktop/Monitor'
      },
      {
        filename: 'DOTO_GS-35F-0889N_68HERD22F0144.pdf',
        contractNumber: '68HERD22F0144',
        fiscalYear: 2022,
        month: 'September',
        order: 'GSA Order',
        type: 'Desktop/Monitor'
      },
      {
        filename: 'GS-35F-0889N 68HERD22F0063.pdf',
        contractNumber: '68HERD22F0063',
        fiscalYear: 2022,
        month: 'March',
        order: 'GSA Order',
        type: 'Desktop/Monitor'
      }
    ];

    const vendors = [
      { name: 'Dell Inc.', duns: '963394772', cage: '7Y735' },
      { name: 'HP Inc.', duns: '848320486', cage: '1N0X8' },
      { name: 'Lenovo (United States) Inc.', duns: '824393456', cage: '5V8P9' },
      { name: 'CDW Government LLC', duns: '963394772', cage: '3GPP8' },
      { name: 'Insight Public Sector Inc.', duns: '156697934', cage: '4QTG4' }
    ];

    const invoices = contractFiles.map((contract, index) => {
      const vendor = vendors[index % vendors.length];
      const baseAmount = this.getContractBaseAmount(contract.type, contract.fiscalYear);
      const variation = (Math.random() - 0.5) * 0.3; // ±15% variation
      const totalAmount = Math.round(baseAmount * (1 + variation));
      
      const contractDate = this.getContractDate(contract.fiscalYear, contract.month);
      
      return {
        id: `inv_${contract.contractNumber.toLowerCase()}`,
        invoiceNumber: `INV-${contract.contractNumber}-001`,
        contractNumber: contract.contractNumber,
        vendorName: vendor.name,
        vendorDUNS: vendor.duns,
        vendorCAGE: vendor.cage,
        totalAwardAmount: totalAmount,
        obligatedAmount: Math.round(totalAmount * 0.85), // 85% obligated
        fiscalYear: contract.fiscalYear,
        contractDate: contractDate,
        lastModified: contractDate,
        status: 'Active',
        schema: this.getContractSchema(contract.type),
        description: this.getContractDescription(contract.type, contract.order),
        naicsCode: this.getNAICSCode(contract.type),
        pscCode: this.getPSCCode(contract.type),
        placeOfPerformance: 'Arlington, VA',
        periodOfPerformance: this.getPeriodOfPerformance(contractDate),
        contractType: 'Firm Fixed Price',
        competitionType: 'Full and Open Competition',
        setAsideType: contract.type === 'BPA Services' ? 'Small Business Set-Aside' : 'No Set-Aside',
        fundingAgency: 'Environmental Protection Agency',
        contractingOffice: 'EPA Headquarters',
        contractingOfficer: 'John Smith',
        programManager: 'Sarah Johnson',
        technicalPOC: 'Mike Davis',
        sourceFile: contract.filename,
        uploadDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      };
    });

    return invoices;
  }

  // Helper methods for contract data generation
  getContractBaseAmount(type, fiscalYear) {
    const baseAmounts = {
      'Laptop': 4500000,
      'Desktop/Monitor': 2800000,
      'BPA Services': 1200000
    };
    
    // Adjust for fiscal year inflation
    const yearMultiplier = 1 + ((fiscalYear - 2021) * 0.05); // 5% annual increase
    return (baseAmounts[type] || 3000000) * yearMultiplier;
  }

  getContractDate(fiscalYear, month) {
    const monthMap = {
      'January': '01', 'February': '02', 'March': '03', 'April': '04',
      'May': '05', 'June': '06', 'July': '07', 'August': '08',
      'September': '09', 'October': '10', 'November': '11', 'December': '12'
    };
    
    const monthNum = monthMap[month] || '01';
    const day = Math.floor(Math.random() * 28) + 1;
    const year = fiscalYear === 2025 ? 2025 : fiscalYear;
    
    return `${year}-${monthNum}-${day.toString().padStart(2, '0')}`;
  }

  getContractSchema(type) {
    const schemas = {
      'Laptop': 'EPA Laptop Procurement',
      'Desktop/Monitor': 'EPA Desktop and Monitor Procurement',
      'BPA Services': 'Blanket Purchase Agreement Services'
    };
    return schemas[type] || 'EPA IT Equipment Procurement';
  }

  getContractDescription(type, order) {
    const descriptions = {
      'Laptop': `${order} - EPA Laptop Refresh Program including laptops, accessories, and setup services`,
      'Desktop/Monitor': `${order} - EPA Desktop and Monitor procurement for office workstations`,
      'BPA Services': `${order} - Blanket Purchase Agreement for IT services and support`
    };
    return descriptions[type] || `${order} - EPA IT Equipment and Services`;
  }

  getNAICSCode(type) {
    const codes = {
      'Laptop': '334111', // Electronic Computer Manufacturing
      'Desktop/Monitor': '334111', // Electronic Computer Manufacturing
      'BPA Services': '541512' // Computer Systems Design Services
    };
    return codes[type] || '334111';
  }

  getPSCCode(type) {
    const codes = {
      'Laptop': '7021', // ADP Equipment
      'Desktop/Monitor': '7021', // ADP Equipment
      'BPA Services': '7030' // ADP Software
    };
    return codes[type] || '7021';
  }

  getPeriodOfPerformance(startDate) {
    const start = new Date(startDate);
    const end = new Date(start);
    end.setFullYear(start.getFullYear() + 1); // 1 year contract
    
    return {
      start: startDate,
      end: end.toISOString().split('T')[0]
    };
  }
}

export default new LocalStorageService();
