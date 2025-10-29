const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');

class PDFExtractor {
  // Extract text from PDF buffer
  static async extractText(pdfBuffer) {
    try {
      const data = await pdfParse(pdfBuffer);
      return data.text;
    } catch (error) {
      console.error('PDF text extraction failed:', error);
      // Fallback to OCR if PDF parsing fails
      return await this.extractTextWithOCR(pdfBuffer);
    }
  }

  // Extract text using OCR (for scanned PDFs)
  static async extractTextWithOCR(pdfBuffer) {
    try {
      const { data: { text } } = await Tesseract.recognize(pdfBuffer, 'eng', {
        logger: m => console.log(m)
      });
      return text;
    } catch (error) {
      console.error('OCR extraction failed:', error);
      throw new Error('Failed to extract text from PDF');
    }
  }

  // Parse EPA contract invoice data based on the chat analysis
  static parseEPAContractData(extractedText) {
    const invoice = {
      contractInfo: {},
      orderDetails: {},
      deliveryPerformance: {},
      deliveryLocations: [],
      productDetails: [],
      totalAwardAmount: 0,
      contractAdministration: {},
      contactInfo: {},
      contractClauses: [],
      fiscalYear: null,
      schema: 'epa_laptop_contract'
    };

    try {
      // Extract contract information
      const contractMatch = extractedText.match(/(?:Contract|Order|BPA).*?(\d{2}[A-Z]+\d+[A-Z]*\d+)/i);
      if (contractMatch) {
        invoice.contractInfo.contractNumber = contractMatch[1];
        invoice.contractInfo.description = this.extractContractDescription(extractedText);
      }

      // Extract total award amount
      const amountMatches = extractedText.match(/\$[\d,]+\.?\d*/g);
      if (amountMatches) {
        const amounts = amountMatches.map(amt => parseFloat(amt.replace(/[$,]/g, '')));
        invoice.totalAwardAmount = Math.max(...amounts);
      }

      // Extract fiscal year
      const fyMatch = extractedText.match(/FY\s*(\d{2,4})/i);
      if (fyMatch) {
        let year = parseInt(fyMatch[1]);
        if (year < 100) year += 2000; // Convert 2-digit to 4-digit year
        invoice.fiscalYear = year;
      }

      // Extract delivery performance
      const deliveryMatch = extractedText.match(/(\d+)\s*days?\s*(?:after|A\.R\.O)/i);
      if (deliveryMatch) {
        invoice.deliveryPerformance.deliveryDays = parseInt(deliveryMatch[1]);
        invoice.deliveryPerformance.deliveryTerms = 'After Receipt of Order (A.R.O.)';
      }

      // Extract contact information
      const emailMatch = extractedText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
      if (emailMatch) {
        invoice.contactInfo.email = emailMatch[1];
      }

      const phoneMatch = extractedText.match(/\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
      if (phoneMatch) {
        invoice.contactInfo.phone = phoneMatch[0];
      }

      // Extract contracting officer
      const officerMatch = extractedText.match(/(?:Contracting Officer|Officer):\s*([A-Za-z\s.]+)/i);
      if (officerMatch) {
        invoice.contactInfo.contractingOfficer = officerMatch[1].trim();
      }

      // Extract delivery locations (EPA regions)
      const regionMatches = extractedText.match(/R\d+\s+(?:Main\s+)?Location[:\s]*([^$\n]*)/gi);
      if (regionMatches) {
        regionMatches.forEach(match => {
          const locationData = this.parseLocationData(match, extractedText);
          if (locationData) {
            invoice.deliveryLocations.push(locationData);
          }
        });
      }

      // Extract product details
      const productMatches = extractedText.match(/Dell\s+[A-Za-z0-9\s-]+/gi);
      if (productMatches) {
        const uniqueProducts = [...new Set(productMatches)];
        uniqueProducts.forEach(product => {
          const productData = this.parseProductData(product, extractedText);
          if (productData) {
            invoice.productDetails.push(productData);
          }
        });
      }

      // Extract contract clauses
      const clauseMatches = extractedText.match(/(?:FAR|EPAAR)\s+[\d.-]+/gi);
      if (clauseMatches) {
        invoice.contractClauses = [...new Set(clauseMatches)];
      }

      return invoice;
    } catch (error) {
      console.error('Error parsing EPA contract data:', error);
      return invoice; // Return partial data even if parsing fails
    }
  }

  // Helper method to extract contract description
  static extractContractDescription(text) {
    const descMatches = [
      /(?:for|FOR)\s+([^.]*(?:Laptop|Desktop|Monitor|Refresh)[^.]*)/i,
      /(?:Contract|Order)\s+(?:for\s+)?([^.]*)/i
    ];

    for (const regex of descMatches) {
      const match = text.match(regex);
      if (match) {
        return match[1].trim();
      }
    }
    return 'EPA Contract';
  }

  // Helper method to parse location data
  static parseLocationData(locationText, fullText) {
    try {
      const regionMatch = locationText.match(/R(\d+)/);
      const region = regionMatch ? `R${regionMatch[1]}` : 'Unknown';

      // Look for quantity and pricing information near this location
      const quantityMatch = fullText.match(new RegExp(`${region}[^$]*?(\\d+)\\s*units?`, 'i'));
      const priceMatch = fullText.match(new RegExp(`${region}[^$]*?\\$([\\d,]+\\.?\\d*)`, 'i'));

      return {
        name: `EPA ${region} Main Location`,
        region: region,
        quantity: quantityMatch ? parseInt(quantityMatch[1]) : 0,
        totalPrice: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0,
        address: this.extractAddress(locationText),
        contact: this.extractContact(locationText)
      };
    } catch (error) {
      console.error('Error parsing location data:', error);
      return null;
    }
  }

  // Helper method to parse product data
  static parseProductData(productText, fullText) {
    try {
      const name = productText.trim();
      
      // Look for quantity information
      const quantityMatch = fullText.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^\\d]*(\\d+)\\s*units?`, 'i'));
      const priceMatch = fullText.match(new RegExp(`${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[^$]*\\$([\\d,]+\\.?\\d*)`, 'i'));

      return {
        name: name,
        description: name,
        quantity: quantityMatch ? parseInt(quantityMatch[1]) : 1,
        unitPrice: priceMatch ? parseFloat(priceMatch[1].replace(/,/g, '')) : 0,
        totalPrice: 0, // Will be calculated
        specifications: this.extractSpecifications(productText, fullText)
      };
    } catch (error) {
      console.error('Error parsing product data:', error);
      return null;
    }
  }

  // Helper method to extract address
  static extractAddress(text) {
    const addressMatch = text.match(/([A-Za-z\s]+,\s*[A-Z]{2})/);
    return addressMatch ? addressMatch[1] : '';
  }

  // Helper method to extract contact
  static extractContact(text) {
    const contactMatch = text.match(/Contact:\s*([A-Za-z\s.]+)/i);
    return contactMatch ? contactMatch[1].trim() : '';
  }

  // Helper method to extract specifications
  static extractSpecifications(productText, fullText) {
    const specs = {};
    
    // Look for common specifications
    const specPatterns = {
      processor: /(?:Intel|AMD)[^,\n]*/i,
      memory: /\d+GB\s*(?:RAM|Memory)/i,
      storage: /\d+GB\s*(?:SSD|HDD|Storage)/i,
      display: /\d+["\s]*(?:inch|in|display|monitor)/i
    };

    Object.keys(specPatterns).forEach(key => {
      const match = fullText.match(specPatterns[key]);
      if (match) {
        specs[key] = match[0];
      }
    });

    return specs;
  }

  // Parse different document schemas
  static parseInvoiceData(extractedText, schema = 'auto') {
    if (schema === 'auto') {
      // Auto-detect schema based on content
      if (extractedText.includes('EPA') && extractedText.includes('Laptop')) {
        schema = 'epa_laptop_contract';
      } else {
        schema = 'generic_invoice';
      }
    }

    switch (schema) {
      case 'epa_laptop_contract':
        return this.parseEPAContractData(extractedText);
      case 'generic_invoice':
        return this.parseGenericInvoiceData(extractedText);
      default:
        return this.parseGenericInvoiceData(extractedText);
    }
  }

  // Generic invoice parser for other document types
  static parseGenericInvoiceData(extractedText) {
    return {
      contractInfo: {
        description: 'Generic Invoice'
      },
      totalAwardAmount: this.extractTotalAmount(extractedText),
      fiscalYear: new Date().getFullYear(),
      schema: 'generic_invoice',
      extractedText: extractedText
    };
  }

  // Extract total amount from any invoice
  static extractTotalAmount(text) {
    const amountMatches = text.match(/(?:Total|Amount|Sum)[\s:]*\$?([\d,]+\.?\d*)/i);
    if (amountMatches) {
      return parseFloat(amountMatches[1].replace(/,/g, ''));
    }
    
    // Fallback: find largest dollar amount
    const allAmounts = text.match(/\$[\d,]+\.?\d*/g);
    if (allAmounts) {
      const amounts = allAmounts.map(amt => parseFloat(amt.replace(/[$,]/g, '')));
      return Math.max(...amounts);
    }
    
    return 0;
  }
}

module.exports = PDFExtractor;
