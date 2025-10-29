// Mock data service for demonstration purposes
export const mockInvoices = [
  {
    id: 'inv_001',
    contractInfo: {
      contractNumber: '68HERD24F0034',
      description: 'FY24 EPA Laptop Refresh for Dell Laptops, Desktops, and Monitors'
    },
    totalAwardAmount: 4560276.18,
    fiscalYear: 2024,
    uploadDate: '2024-01-15T10:30:00Z',
    schema: 'epa_laptop_contract',
    status: 'processed',
    deliveryLocations: [
      { name: 'EPA R1 Main Location', region: 'R1', totalPrice: 139209.85, quantity: 79 },
      { name: 'EPA R2 Main Location', region: 'R2', totalPrice: 220268.75, quantity: 125 },
      { name: 'EPA R3 Main Location', region: 'R3', totalPrice: 185432.50, quantity: 95 },
      { name: 'EPA R4 Main Location', region: 'R4', totalPrice: 199122.95, quantity: 113 },
      { name: 'EPA R5 Main Location', region: 'R5', totalPrice: 274895.40, quantity: 156 }
    ],
    productDetails: [
      { name: 'Dell Latitude 5340 2-in-1', quantity: 568, unitPrice: 1650, totalPrice: 937200 },
      { name: 'Dell Dock WD19DS', quantity: 568, unitPrice: 125, totalPrice: 71000 },
      { name: 'Dell 27 Monitor', quantity: 100, unitPrice: 350, totalPrice: 35000 },
      { name: 'Dell 24 Monitor', quantity: 510, unitPrice: 275, totalPrice: 140250 }
    ]
  },
  {
    id: 'inv_002',
    contractInfo: {
      contractNumber: '68HERD24F0065',
      description: 'FY24 EPA Laptop May Refresh'
    },
    totalAwardAmount: 2850000.00,
    fiscalYear: 2024,
    uploadDate: '2024-05-20T14:15:00Z',
    schema: 'epa_laptop_contract',
    status: 'processed',
    deliveryLocations: [
      { name: 'EPA R6 Main Location', region: 'R6', totalPrice: 174452.85, quantity: 99 },
      { name: 'EPA R7 Main Location', region: 'R7', totalPrice: 137447.70, quantity: 78 },
      { name: 'EPA R8 Main Location', region: 'R8', totalPrice: 158593.50, quantity: 90 },
      { name: 'EPA R9 Main Location', region: 'R9', totalPrice: 207933.70, quantity: 118 },
      { name: 'EPA R10 Main Location', region: 'R10', totalPrice: 146258.45, quantity: 83 }
    ],
    productDetails: [
      { name: 'Dell Latitude 5340 2-in-1', quantity: 468, unitPrice: 1650, totalPrice: 772200 },
      { name: 'Dell Dock WD19DS', quantity: 468, unitPrice: 125, totalPrice: 58500 }
    ]
  },
  {
    id: 'inv_003',
    contractInfo: {
      contractNumber: '68HERD24F0117',
      description: 'FY24 EPA Laptop September Refresh'
    },
    totalAwardAmount: 1950000.00,
    fiscalYear: 2024,
    uploadDate: '2024-09-10T09:45:00Z',
    schema: 'epa_laptop_contract',
    status: 'processed',
    deliveryLocations: [
      { name: 'EISD Landover Warehouse', region: 'EISD', totalPrice: 1950000.00, quantity: 1500 }
    ],
    productDetails: [
      { name: 'Dell Latitude 5340 2-in-1', quantity: 300, unitPrice: 1650, totalPrice: 495000 },
      { name: 'Dell Dock WD19DS', quantity: 300, unitPrice: 125, totalPrice: 37500 }
    ]
  },
  {
    id: 'inv_004',
    contractInfo: {
      contractNumber: '67HERD23F0089',
      description: 'FY23 EPA IT Equipment Refresh'
    },
    totalAwardAmount: 3200000.00,
    fiscalYear: 2023,
    uploadDate: '2023-11-15T11:20:00Z',
    schema: 'epa_laptop_contract',
    status: 'processed',
    deliveryLocations: [
      { name: 'EPA R1 Main Location', region: 'R1', totalPrice: 320000.00, quantity: 150 },
      { name: 'EPA R2 Main Location', region: 'R2', totalPrice: 480000.00, quantity: 225 },
      { name: 'EPA R5 Main Location', region: 'R5', totalPrice: 640000.00, quantity: 300 }
    ],
    productDetails: [
      { name: 'Dell Latitude 5320', quantity: 675, unitPrice: 1450, totalPrice: 978750 },
      { name: 'Dell Dock WD19S', quantity: 675, unitPrice: 115, totalPrice: 77625 }
    ]
  }
];

export const mockAnalytics = {
  totalInvoices: 4,
  totalValue: 12560276.18,
  averageValue: 3140069.05,
  byFiscalYear: {
    2023: { count: 1, value: 3200000.00 },
    2024: { count: 3, value: 9360276.18 }
  },
  bySchema: {
    epa_laptop_contract: { count: 4, value: 12560276.18 }
  },
  byMonth: {
    '2023-11': { count: 1, value: 3200000.00 },
    '2024-01': { count: 1, value: 4560276.18 },
    '2024-05': { count: 1, value: 2850000.00 },
    '2024-09': { count: 1, value: 1950000.00 }
  },
  topProducts: {
    'Dell Latitude 5340 2-in-1': { count: 1336, totalValue: 2204400 },
    'Dell Dock WD19DS': { count: 1336, totalValue: 167000 },
    'Dell Latitude 5320': { count: 675, totalValue: 978750 },
    'Dell 27 Monitor': { count: 100, totalValue: 35000 },
    'Dell 24 Monitor': { count: 510, totalValue: 140250 }
  },
  topLocations: {
    'EPA R1 Main Location': { count: 2, totalValue: 459209.85 },
    'EPA R2 Main Location': { count: 2, totalValue: 700268.75 },
    'EPA R5 Main Location': { count: 2, totalValue: 914895.40 },
    'EISD Landover Warehouse': { count: 1, totalValue: 1950000.00 }
  }
};

export const mockConversations = [
  {
    id: 'conv_001',
    message: 'What is the total value of contracts for FY2024?',
    response: 'Based on the invoice data, the total value of contracts for FY2024 is $9,360,276.18 across 3 invoices. This includes:\n\n- January refresh: $4,560,276.18\n- May refresh: $2,850,000.00\n- September refresh: $1,950,000.00\n\nThis represents a significant investment in EPA\'s IT infrastructure for fiscal year 2024.',
    timestamp: '2024-09-29T10:15:00Z',
    context: {
      invoicesAnalyzed: 3,
      totalValue: 9360276.18,
      fiscalYears: [2024]
    }
  },
  {
    id: 'conv_002',
    message: 'Show me the top 3 products by total value',
    response: 'Here are the top 3 products by total value:\n\n1. **Dell Latitude 5340 2-in-1** - $2,204,400 (1,336 units)\n2. **Dell Latitude 5320** - $978,750 (675 units)\n3. **Dell Dock WD19DS** - $167,000 (1,336 units)\n\nThe Dell Latitude 5340 2-in-1 is clearly the primary laptop model being procured across multiple refresh cycles.',
    timestamp: '2024-09-29T10:10:00Z',
    context: {
      invoicesAnalyzed: 4,
      totalValue: 12560276.18,
      fiscalYears: [2023, 2024]
    }
  }
];

export const mockReports = [
  {
    id: 'rpt_001',
    title: 'FY2024 Quarterly Summary',
    format: 'pdf',
    generatedAt: '2024-09-29T09:30:00Z',
    status: 'generated',
    invoicesIncluded: 3,
    totalValue: 9360276.18
  },
  {
    id: 'rpt_002',
    title: 'EPA Regional Analysis',
    format: 'excel',
    generatedAt: '2024-09-28T14:20:00Z',
    status: 'generated',
    invoicesIncluded: 4,
    totalValue: 12560276.18
  },
  {
    id: 'rpt_003',
    title: 'Product Procurement Summary',
    format: 'csv',
    generatedAt: '2024-09-27T11:45:00Z',
    status: 'generated',
    invoicesIncluded: 4,
    totalValue: 12560276.18
  }
];

export const mockActivityLogs = {
  totalActivities: 45,
  byType: {
    invoice_upload: 4,
    chat_query: 12,
    report_generation: 8,
    email_sent: 3,
    analytics_view: 18
  },
  byDay: {
    '2024-09-29': 8,
    '2024-09-28': 12,
    '2024-09-27': 15,
    '2024-09-26': 10
  },
  recentActivities: [
    { type: 'chat_query', timestamp: '2024-09-29T10:15:00Z' },
    { type: 'report_generation', timestamp: '2024-09-29T09:30:00Z' },
    { type: 'analytics_view', timestamp: '2024-09-29T09:15:00Z' }
  ]
};

export const mockSuggestions = {
  general: [
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
  ],
  dynamic: [
    "Analyze the 4 invoices in the system",
    "What is the total value of $12,560,276?",
    "Compare fiscal years 2023, 2024"
  ],
  analytics: {
    totalInvoices: 4,
    totalValue: 12560276.18,
    fiscalYears: ['2023', '2024']
  }
};

export const mockScheduledEmails = [
  {
    id: 'sched_001',
    name: 'Weekly Summary Report',
    description: 'Weekly summary of invoice processing and analytics',
    recipients: ['manager@epa.gov', 'contracts@epa.gov'],
    schedule: {
      frequency: 'weekly',
      time: '09:00',
      dayOfWeek: 1
    },
    active: true,
    createdAt: '2024-09-20T10:00:00Z',
    runCount: 3
  },
  {
    id: 'sched_002',
    name: 'Monthly Financial Report',
    description: 'Monthly financial summary for management review',
    recipients: ['cfo@epa.gov', 'finance@epa.gov'],
    schedule: {
      frequency: 'monthly',
      time: '08:00',
      dayOfMonth: 1
    },
    active: true,
    createdAt: '2024-09-01T08:00:00Z',
    runCount: 1
  }
];

// Mock API responses
export const mockApiResponses = {
  '/api/invoices': {
    success: true,
    count: mockInvoices.length,
    data: mockInvoices
  },
  '/api/analytics/dashboard': {
    success: true,
    data: mockAnalytics
  },
  '/api/chat/conversations': {
    success: true,
    data: mockConversations
  },
  '/api/chat/suggestions': {
    success: true,
    data: mockSuggestions
  },
  '/api/reports/history': {
    success: true,
    data: mockReports
  },
  '/api/analytics/activity/summary': {
    success: true,
    data: mockActivityLogs
  },
  '/api/email/scheduled': {
    success: true,
    data: mockScheduledEmails
  }
};
