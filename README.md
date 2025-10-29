# Invoice Analytics Application

A comprehensive web application designed for Contract Specialists to manage, analyze, and generate reports from invoice data across multiple fiscal years.

## Features

### Core Functionality
- **Multi-file Upload**: Upload Page 1 and Page 2 of invoices simultaneously
- **OCR & Text Extraction**: Extract structured data from PDF invoices using advanced OCR
- **Multiple Document Schemas**: Support for EPA laptop contracts and generic invoices
- **Firebase Integration**: Secure cloud storage and real-time data management

### Analytics Dashboard
- **Real-time Analytics**: Running totals, trends, and performance metrics
- **Fiscal Year Comparisons**: Multi-year analysis and trending
- **Location Analysis**: Breakdown by EPA regions and delivery locations
- **Product Analytics**: Top products, quantities, and pricing analysis
- **Interactive Charts**: Modern visualizations with Chart.js

### AI-Powered Chat Interface
- **Natural Language Queries**: Ask questions about invoice data in plain English
- **Contextual Responses**: AI understands fiscal years, locations, products, and contracts
- **Report Generation**: Generate custom reports directly from chat queries
- **Query Suggestions**: Smart suggestions based on available data

### Report Generation
- **Multiple Formats**: PDF, Excel, and CSV export options
- **Custom Reports**: Build reports with specific filters and sections
- **Timestamped Reports**: All reports include generation timestamps
- **Template System**: Pre-built report templates for common use cases

### Email Automation
- **Automated Delivery**: Schedule regular report delivery
- **Custom Recipients**: Send to multiple stakeholders
- **Email Templates**: Professional email formatting with attachments
- **Delivery Tracking**: Monitor email delivery status and history

### Logging & Monitoring
- **Activity Logs**: Track all user actions and system operations
- **Report Analytics**: Analyze report usage patterns and popular queries
- **Performance Monitoring**: System health and processing metrics
- **Audit Trail**: Complete audit trail for compliance requirements

## Technology Stack

### Backend
- **Node.js** with Express.js framework
- **Firebase Firestore** for data storage
- **PDF-Parse & Tesseract.js** for document processing
- **OpenAI GPT-4** for AI chat functionality
- **Nodemailer** for email automation
- **PDFKit, ExcelJS, CSV-Writer** for report generation

### Frontend
- **React 18** with modern hooks and context
- **Material-UI** for sleek, modern interface
- **Chart.js** for interactive analytics
- **Framer Motion** for smooth animations
- **Axios** for API communication

### Security & Performance
- **Helmet.js** for security headers
- **Rate limiting** to prevent abuse
- **File validation** and size limits
- **Error handling** and logging
- **CORS** configuration

## Installation

### Prerequisites
- Node.js 16+ and npm
- Firebase project with Firestore enabled
- OpenAI API key
- Email service credentials (Gmail recommended)

### Setup

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd EPA_Laptops
   npm install
   cd client && npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Configure the following variables in `.env`:
   ```
   # Firebase Configuration
   FIREBASE_PROJECT_ID=your-project-id
   FIREBASE_PRIVATE_KEY=your-private-key
   FIREBASE_CLIENT_EMAIL=your-client-email
   
   # OpenAI Configuration
   OPENAI_API_KEY=your-openai-api-key
   
   # Email Configuration
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASS=your-app-password
   
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   ```

3. **Firebase Setup**
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Create a service account and download the JSON key
   - Extract the required fields for your `.env` file

4. **Start the Application**
   ```bash
   # Development mode (runs both backend and frontend)
   npm run dev
   
   # Production mode
   npm run build
   npm start
   ```

## Usage

### Uploading Invoices

1. Navigate to the Upload section
2. Select Page 1 and Page 2 of your invoice (PDF format)
3. Choose the appropriate document schema (auto-detection available)
4. Click "Upload and Process"
5. View the extracted data and analytics

### Using the Chat Interface

1. Navigate to the Chat section
2. Ask questions like:
   - "What is the total value of contracts for the past 3 fiscal years?"
   - "Show me the top 5 products by total value"
   - "Which EPA regions have the highest contract values?"
   - "Generate a quarterly report for FY2024"

### Generating Reports

1. Use the Chat interface to request a report, or
2. Navigate to Reports section for custom report builder
3. Select format (PDF, Excel, or CSV)
4. Configure filters and sections
5. Download or email the report

### Setting Up Email Automation

1. Navigate to Email Settings
2. Create a new scheduled email
3. Configure recipients, schedule, and report parameters
4. The system will automatically generate and send reports

## API Documentation

### Invoice Management
- `POST /api/invoices/upload` - Upload and process invoice files
- `GET /api/invoices` - Get all invoices with filters
- `GET /api/invoices/:id` - Get specific invoice
- `GET /api/invoices/search/:term` - Search invoices

### Analytics
- `GET /api/analytics/dashboard` - Get dashboard analytics
- `GET /api/analytics/fiscal-years` - Fiscal year comparisons
- `GET /api/analytics/trends/monthly` - Monthly trends
- `GET /api/analytics/products/top` - Top products analysis

### Chat & AI
- `POST /api/chat/query` - Send chat query
- `GET /api/chat/conversations` - Get conversation history
- `GET /api/chat/suggestions` - Get query suggestions
- `POST /api/chat/generate-report` - Generate report from chat

### Reports
- `POST /api/reports/generate` - Generate custom report
- `GET /api/reports/download/:reportId` - Download report
- `GET /api/reports/history` - Get report history
- `GET /api/reports/templates` - Get report templates

### Email
- `POST /api/email/send-report` - Send report via email
- `POST /api/email/schedule` - Schedule automated emails
- `GET /api/email/scheduled` - Get scheduled emails
- `GET /api/email/history` - Get email history

## Document Schemas

### EPA Laptop Contract Schema
Designed for EPA laptop refresh contracts, extracts:
- Contract information and numbers
- Delivery locations and contacts
- Product details and specifications
- Pricing and total amounts
- Fiscal year and dates
- Contract clauses and administration

### Generic Invoice Schema
For general invoices, extracts:
- Basic contract information
- Total amounts
- Fiscal year
- General text content

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
