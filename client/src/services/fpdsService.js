import axios from 'axios';
import localStorageService from './localStorageService';

/**
 * Federal Procurement Data System (FPDS) Search Service
 * Provides functionality to search and retrieve federal contract data from FPDS.gov
 */
class FPDSService {
  constructor() {
    this.baseUrl = 'https://www.fpds.gov/ezsearch/FEEDS/ATOM';
    this.searchUrl = 'https://www.fpds.gov/fpdsng_cms/index.php/en/reports/62-atom-feed-files';
    
    // FPDS uses ATOM feeds for data access
    this.atomFeedUrl = 'https://www.fpds.gov/ezsearch/FEEDS/ATOM';
    
    // Common search parameters
    this.defaultParams = {
      FEEDNAME: 'PUBLIC',
      VERSION: '1.5.1',
      q: '', // Search query
      s: 'FPDS', // Source
      templateName: 'fpds',
      format: 'ATOM'
    };
  }

  /**
   * FPDS Search Schema Definition
   * Defines all available search parameters and their types
   */
  getSearchSchema() {
    return {
      // Basic Search Parameters
      basic: {
        contractingAgencyName: {
          type: 'string',
          description: 'Name of the contracting agency (e.g., "ENVIRONMENTAL PROTECTION AGENCY")',
          example: 'ENVIRONMENTAL PROTECTION AGENCY'
        },
        vendorName: {
          type: 'string',
          description: 'Vendor/contractor name',
          example: 'Dell Inc.'
        },
        contractNumber: {
          type: 'string',
          description: 'Contract number or identifier',
          example: '68HERD24F0034'
        },
        piid: {
          type: 'string',
          description: 'Procurement Instrument Identifier',
          example: '68HERD24F0034'
        },
        naicsCode: {
          type: 'string',
          description: 'NAICS (North American Industry Classification System) code',
          example: '334111'
        },
        pscCode: {
          type: 'string',
          description: 'Product Service Code',
          example: '7021'
        }
      },

      // Date Range Parameters
      dateRange: {
        signedDateFrom: {
          type: 'date',
          description: 'Contract signed date from (YYYY-MM-DD)',
          example: '2024-01-01'
        },
        signedDateTo: {
          type: 'date',
          description: 'Contract signed date to (YYYY-MM-DD)',
          example: '2024-12-31'
        },
        lastModifiedFrom: {
          type: 'date',
          description: 'Last modified date from (YYYY-MM-DD)',
          example: '2024-01-01'
        },
        lastModifiedTo: {
          type: 'date',
          description: 'Last modified date to (YYYY-MM-DD)',
          example: '2024-12-31'
        }
      },

      // Financial Parameters
      financial: {
        dollarAmountFrom: {
          type: 'number',
          description: 'Minimum contract value',
          example: 25000
        },
        dollarAmountTo: {
          type: 'number',
          description: 'Maximum contract value',
          example: 10000000
        },
        fundingAgencyName: {
          type: 'string',
          description: 'Name of the funding agency',
          example: 'ENVIRONMENTAL PROTECTION AGENCY'
        }
      },

      // Location Parameters
      location: {
        placeOfPerformanceState: {
          type: 'string',
          description: 'State where work is performed (2-letter code)',
          example: 'VA'
        },
        placeOfPerformanceCity: {
          type: 'string',
          description: 'City where work is performed',
          example: 'Arlington'
        },
        vendorState: {
          type: 'string',
          description: 'Vendor state (2-letter code)',
          example: 'TX'
        },
        vendorCity: {
          type: 'string',
          description: 'Vendor city',
          example: 'Round Rock'
        }
      },

      // Contract Type Parameters
      contractType: {
        typeOfContract: {
          type: 'string',
          description: 'Type of contract',
          options: ['FIRM FIXED PRICE', 'COST PLUS FIXED FEE', 'TIME AND MATERIALS', 'LABOR HOURS'],
          example: 'FIRM FIXED PRICE'
        },
        extentCompeted: {
          type: 'string',
          description: 'Extent of competition',
          options: ['FULL AND OPEN COMPETITION', 'NOT COMPETED', 'NOT AVAILABLE FOR COMPETITION'],
          example: 'FULL AND OPEN COMPETITION'
        },
        setAsideType: {
          type: 'string',
          description: 'Set-aside type',
          options: ['NO SET ASIDE USED', 'SMALL BUSINESS SET ASIDE', 'WOMAN OWNED SMALL BUSINESS'],
          example: 'SMALL BUSINESS SET ASIDE'
        }
      },

      // Advanced Parameters
      advanced: {
        descriptionOfRequirement: {
          type: 'string',
          description: 'Description or keywords in contract description',
          example: 'laptop computer desktop monitor'
        },
        contractActionType: {
          type: 'string',
          description: 'Type of contract action',
          options: ['NEW WORK', 'CONTINUE', 'MODIFY', 'RENEW'],
          example: 'NEW WORK'
        },
        reasonForModification: {
          type: 'string',
          description: 'Reason for contract modification',
          example: 'ADDITIONAL WORK'
        }
      },

      // Output Parameters
      output: {
        maxRecords: {
          type: 'number',
          description: 'Maximum number of records to return (1-1000)',
          default: 100,
          min: 1,
          max: 1000
        },
        sortBy: {
          type: 'string',
          description: 'Field to sort results by',
          options: ['signedDate', 'dollarAmount', 'vendorName', 'lastModified'],
          default: 'signedDate'
        },
        sortOrder: {
          type: 'string',
          description: 'Sort order',
          options: ['ASC', 'DESC'],
          default: 'DESC'
        }
      }
    };
  }

  /**
   * Build search query parameters from search criteria
   */
  buildSearchParams(searchCriteria) {
    const params = new URLSearchParams();
    
    // Add default parameters
    Object.entries(this.defaultParams).forEach(([key, value]) => {
      if (value) params.append(key, value);
    });

    // Build query string from search criteria
    const queryParts = [];

    // Basic parameters
    if (searchCriteria.contractingAgencyName) {
      queryParts.push(`CONTRACTING_AGENCY_NAME:"${searchCriteria.contractingAgencyName}"`);
    }
    
    if (searchCriteria.vendorName) {
      queryParts.push(`VENDOR_NAME:"${searchCriteria.vendorName}"`);
    }
    
    if (searchCriteria.contractNumber) {
      queryParts.push(`PIID:"${searchCriteria.contractNumber}"`);
    }

    if (searchCriteria.naicsCode) {
      queryParts.push(`NAICS_CODE:"${searchCriteria.naicsCode}"`);
    }

    if (searchCriteria.pscCode) {
      queryParts.push(`PSC_CODE:"${searchCriteria.pscCode}"`);
    }

    // Date ranges
    if (searchCriteria.signedDateFrom) {
      queryParts.push(`SIGNED_DATE:[${searchCriteria.signedDateFrom} TO *]`);
    }
    
    if (searchCriteria.signedDateTo) {
      queryParts.push(`SIGNED_DATE:[* TO ${searchCriteria.signedDateTo}]`);
    }

    // Financial parameters
    if (searchCriteria.dollarAmountFrom) {
      queryParts.push(`DOLLARS_OBLIGATED:[${searchCriteria.dollarAmountFrom} TO *]`);
    }
    
    if (searchCriteria.dollarAmountTo) {
      queryParts.push(`DOLLARS_OBLIGATED:[* TO ${searchCriteria.dollarAmountTo}]`);
    }

    // Location parameters
    if (searchCriteria.placeOfPerformanceState) {
      queryParts.push(`PLACE_OF_PERFORMANCE_STATE:"${searchCriteria.placeOfPerformanceState}"`);
    }

    // Description search
    if (searchCriteria.descriptionOfRequirement) {
      queryParts.push(`DESCRIPTION_OF_REQUIREMENT:"${searchCriteria.descriptionOfRequirement}"`);
    }

    // Join all query parts
    if (queryParts.length > 0) {
      params.set('q', queryParts.join(' AND '));
    }

    // Add output parameters
    if (searchCriteria.maxRecords) {
      params.set('num', Math.min(searchCriteria.maxRecords, 1000));
    }

    return params;
  }

  /**
   * Search FPDS for contracts matching criteria
   */
  async searchContracts(searchCriteria) {
    try {
      const params = this.buildSearchParams(searchCriteria);
      const searchUrl = `${this.atomFeedUrl}?${params.toString()}`;
      
      console.log('FPDS Search URL:', searchUrl);

      // Use axios to fetch the ATOM feed. A backend proxy is recommended for production
      // to handle CORS and potential rate limiting.
      const response = await axios.get(searchUrl, {
        headers: {
          'Accept': 'application/atom+xml, application/xml, text/xml',
          'User-Agent': 'EPA-Analytics-Platform/1.0'
        }
      });

      const xmlText = response.data;
      const contracts = this.parseAtomFeed(xmlText);
      
      // Store search results
      this.storeSearchResults(searchCriteria, contracts);
      
      return {
        success: true,
        data: contracts,
        total: contracts.length,
        searchCriteria,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('FPDS Search Error:', error);
      throw new Error('Failed to fetch data from FPDS. The service may be down or the query may be invalid.');
    }
  }

  /**
   * Parse ATOM feed XML response from FPDS
   */
  parseAtomFeed(xmlText) {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      
      const entries = xmlDoc.getElementsByTagName('entry');
      const contracts = [];

      for (let i = 0; i < entries.length; i++) {
        const entry = entries[i];
        const contract = this.parseContractEntry(entry);
        if (contract) {
          contracts.push(contract);
        }
      }

      return contracts;
    } catch (error) {
      console.error('XML Parsing Error:', error);
      return [];
    }
  }

  /**
   * Parse individual contract entry from ATOM feed with comprehensive details
   */
  parseContractEntry(entry) {
    try {
      const getElementText = (tagName) => {
        const element = entry.getElementsByTagName(tagName)[0];
        return element ? element.textContent.trim() : '';
      };

      const getNumericValue = (tagName) => {
        const value = getElementText(tagName);
        return value ? parseFloat(value.replace(/[,$]/g, '')) : 0;
      };

      return {
        // Basic Information
        id: getElementText('id'),
        title: getElementText('title'),
        piid: getElementText('piid') || getElementText('PIID'),
        modNumber: getElementText('modnumber') || getElementText('MOD_NUMBER'),
        transactionNumber: getElementText('transactionnumber') || getElementText('TRANSACTION_NUMBER'),
        
        // Agency Information
        contractingAgencyName: getElementText('contractingagencyname') || getElementText('CONTRACTING_AGENCY_NAME'),
        contractingAgencyId: getElementText('contractingagencyid') || getElementText('CONTRACTING_AGENCY_ID'),
        contractingOfficeName: getElementText('contractingofficename') || getElementText('CONTRACTING_OFFICE_NAME'),
        contractingOfficeId: getElementText('contractingofficeid') || getElementText('CONTRACTING_OFFICE_ID'),
        fundingAgencyName: getElementText('fundingagencyname') || getElementText('FUNDING_AGENCY_NAME'),
        fundingAgencyId: getElementText('fundingagencyid') || getElementText('FUNDING_AGENCY_ID'),
        
        // Vendor Information
        vendorName: getElementText('vendorname') || getElementText('VENDOR_NAME'),
        vendorDunsNumber: getElementText('vendordunsnumber') || getElementText('VENDOR_DUNS_NUMBER'),
        vendorAlternateName: getElementText('vendoralternatename') || getElementText('VENDOR_ALTERNATE_NAME'),
        vendorLegalOrgName: getElementText('vendorlegalorgname') || getElementText('VENDOR_LEGAL_ORG_NAME'),
        vendorDoingAsBusinessName: getElementText('vendordoingasbusinessname') || getElementText('VENDOR_DOING_AS_BUSINESS_NAME'),
        vendorAddressLine1: getElementText('vendoraddressline1') || getElementText('VENDOR_ADDRESS_LINE_1'),
        vendorAddressLine2: getElementText('vendoraddressline2') || getElementText('VENDOR_ADDRESS_LINE_2'),
        vendorCity: getElementText('vendorcity') || getElementText('VENDOR_CITY'),
        vendorState: getElementText('vendorstate') || getElementText('VENDOR_STATE'),
        vendorZipCode: getElementText('vendorzipcode') || getElementText('VENDOR_ZIP_CODE'),
        vendorCountryCode: getElementText('vendorcountrycode') || getElementText('VENDOR_COUNTRY_CODE'),
        vendorPhoneNumber: getElementText('vendorphonenumber') || getElementText('VENDOR_PHONE_NUMBER'),
        vendorFaxNumber: getElementText('vendorfaxnumber') || getElementText('VENDOR_FAX_NUMBER'),
        
        // Financial Information
        dollarAmount: getNumericValue('dollarsobligated') || getNumericValue('DOLLARS_OBLIGATED'),
        baseAndExercisedOptionsValue: getNumericValue('baseandexercisedoptionsvalue') || getNumericValue('BASE_AND_EXERCISED_OPTIONS_VALUE'),
        baseAndAllOptionsValue: getNumericValue('baseandalloptionsvalue') || getNumericValue('BASE_AND_ALL_OPTIONS_VALUE'),
        
        // Dates
        signedDate: getElementText('signeddate') || getElementText('SIGNED_DATE'),
        effectiveDate: getElementText('effectivedate') || getElementText('EFFECTIVE_DATE'),
        currentCompletionDate: getElementText('currentcompletiondate') || getElementText('CURRENT_COMPLETION_DATE'),
        ultimateCompletionDate: getElementText('ultimatecompletiondate') || getElementText('ULTIMATE_COMPLETION_DATE'),
        lastModified: getElementText('lastmodified') || getElementText('LAST_MODIFIED'),
        
        // Classification
        naicsCode: getElementText('naicscode') || getElementText('NAICS_CODE'),
        naicsDescription: getElementText('naicsdescription') || getElementText('NAICS_DESCRIPTION'),
        pscCode: getElementText('psccode') || getElementText('PSC_CODE'),
        pscDescription: getElementText('pscdescription') || getElementText('PSC_DESCRIPTION'),
        
        // Contract Details
        descriptionOfRequirement: getElementText('descriptionofrequirement') || getElementText('DESCRIPTION_OF_REQUIREMENT'),
        typeOfContract: getElementText('typeofcontract') || getElementText('TYPE_OF_CONTRACT'),
        typeOfContractPricing: getElementText('typeofcontractpricing') || getElementText('TYPE_OF_CONTRACT_PRICING'),
        contractActionType: getElementText('contractactiontype') || getElementText('CONTRACT_ACTION_TYPE'),
        reasonForModification: getElementText('reasonformodification') || getElementText('REASON_FOR_MODIFICATION'),
        
        // Competition Information
        extentCompeted: getElementText('extentcompeted') || getElementText('EXTENT_COMPETED'),
        reasonNotCompeted: getElementText('reasonnotcompeted') || getElementText('REASON_NOT_COMPETED'),
        numberOfOffersReceived: getElementText('numberofoffersreceived') || getElementText('NUMBER_OF_OFFERS_RECEIVED'),
        
        // Set-Aside Information
        setAsideType: getElementText('setasidetype') || getElementText('SET_ASIDE_TYPE'),
        typeOfSetAside: getElementText('typeofsetaside') || getElementText('TYPE_OF_SET_ASIDE'),
        
        // Performance Information
        placeOfPerformanceCity: getElementText('placeofperformancecity') || getElementText('PLACE_OF_PERFORMANCE_CITY'),
        placeOfPerformanceState: getElementText('placeofperformancestate') || getElementText('PLACE_OF_PERFORMANCE_STATE'),
        placeOfPerformanceCountry: getElementText('placeofperformancecountry') || getElementText('PLACE_OF_PERFORMANCE_COUNTRY'),
        placeOfPerformanceZip: getElementText('placeofperformancezip') || getElementText('PLACE_OF_PERFORMANCE_ZIP'),
        principalPlaceOfPerformance: getElementText('principalplaceofperformance') || getElementText('PRINCIPAL_PLACE_OF_PERFORMANCE'),
        
        // Additional Details
        contractingOfficerBusinessSizeDetermination: getElementText('contractingofficerbusinesssizedetermination') || getElementText('CONTRACTING_OFFICER_BUSINESS_SIZE_DETERMINATION'),
        commercialItemAcquisitionProcedures: getElementText('commercialitemacquisitionprocedures') || getElementText('COMMERCIAL_ITEM_ACQUISITION_PROCEDURES'),
        commercialItemTestProgram: getElementText('commercialitemtestprogram') || getElementText('COMMERCIAL_ITEM_TEST_PROGRAM'),
        consolidatedContract: getElementText('consolidatedcontract') || getElementText('CONSOLIDATED_CONTRACT'),
        costOrPricingData: getElementText('costorpricingdata') || getElementText('COST_OR_PRICING_DATA'),
        costAccountingStandardsClause: getElementText('costaccountingstandardsclause') || getElementText('COST_ACCOUNTING_STANDARDS_CLAUSE'),
        
        // Socioeconomic Information
        womanOwnedSmallBusiness: getElementText('womanownedsmallbusiness') || getElementText('WOMAN_OWNED_SMALL_BUSINESS'),
        veteranOwnedSmallBusiness: getElementText('veteranownedsmallbusiness') || getElementText('VETERAN_OWNED_SMALL_BUSINESS'),
        serviceDisabledVeteranOwnedSmallBusiness: getElementText('servicedisabledveteranownedsmallbusiness') || getElementText('SERVICE_DISABLED_VETERAN_OWNED_SMALL_BUSINESS'),
        hubzoneSmallBusiness: getElementText('hubzonesmallbusiness') || getElementText('HUBZONE_SMALL_BUSINESS'),
        smallDisadvantagedBusiness: getElementText('smalldisadvantagedbusiness') || getElementText('SMALL_DISADVANTAGED_BUSINESS'),
        historicallyBlackCollegeOrUniversity: getElementText('historicallyblackcollegeoruniversity') || getElementText('HISTORICALLY_BLACK_COLLEGE_OR_UNIVERSITY'),
        
        // System Information
        updated: getElementText('updated'),
        link: entry.getElementsByTagName('link')[0]?.getAttribute('href') || '',
        
        // Additional metadata
        fiscalYear: this.extractFiscalYear(getElementText('signeddate') || getElementText('SIGNED_DATE')),
        contractValue: this.formatCurrency(getNumericValue('dollarsobligated') || getNumericValue('DOLLARS_OBLIGATED'))
      };
    } catch (error) {
      console.error('Contract Entry Parsing Error:', error);
      return null;
    }
  }

  /**
   * Extract fiscal year from date
   */
  extractFiscalYear(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = date.getMonth() + 1; // JavaScript months are 0-indexed
      // Federal fiscal year starts October 1
      return month >= 10 ? year + 1 : year;
    } catch {
      return null;
    }
  }

  /**
   * Format currency value
   */
  formatCurrency(amount) {
    if (!amount || amount === 0) return '$0';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  /**
   * Store search results in localStorage for caching
   */
  storeSearchResults(searchCriteria, contracts) {
    try {
      const searchHistory = this.getSearchHistory();
      const searchResult = {
        id: Date.now().toString(),
        criteria: searchCriteria,
        results: contracts,
        timestamp: new Date().toISOString(),
        resultCount: contracts.length
      };

      searchHistory.unshift(searchResult);
      
      // Keep only last 10 searches
      if (searchHistory.length > 10) {
        searchHistory.splice(10);
      }

      const settings = localStorageService.getSettings();
      settings.fpdsSearchHistory = searchHistory;
      localStorageService.updateSettings(settings);
    } catch (error) {
      console.error('Error storing search results:', error);
    }
  }

  /**
   * Get search history from localStorage
   */
  getSearchHistory() {
    try {
      const settings = localStorageService.getSettings();
      return settings.fpdsSearchHistory || [];
    } catch (error) {
      console.error('Error getting search history:', error);
      return [];
    }
  }

  /**
   * Get mock search results for demo purposes
   */
  getMockSearchResults(searchCriteria) {
    const mockContracts = [
      {
        id: 'fpds_mock_1',
        title: 'EPA Laptop and Desktop Computer Procurement',
        piid: '68HERD24F0034',
        modNumber: '0',
        transactionNumber: '68HERD24F0034_0',
        
        // Agency Information
        contractingAgencyName: 'ENVIRONMENTAL PROTECTION AGENCY',
        contractingAgencyId: '6800',
        contractingOfficeName: 'EPA HEADQUARTERS',
        contractingOfficeId: '68HERD',
        fundingAgencyName: 'ENVIRONMENTAL PROTECTION AGENCY',
        fundingAgencyId: '6800',
        
        // Vendor Information
        vendorName: 'Dell Inc.',
        vendorDunsNumber: '963394772',
        vendorLegalOrgName: 'Dell Inc.',
        vendorDoingAsBusinessName: 'Dell',
        vendorAddressLine1: '1 Dell Way',
        vendorAddressLine2: '',
        vendorCity: 'Round Rock',
        vendorState: 'TX',
        vendorZipCode: '78682',
        vendorCountryCode: 'USA',
        vendorPhoneNumber: '(512) 338-4400',
        vendorFaxNumber: '',
        
        // Financial Information
        dollarAmount: 4560276.18,
        baseAndExercisedOptionsValue: 4560276.18,
        baseAndAllOptionsValue: 5460276.18,
        
        // Dates
        signedDate: '2024-01-15',
        effectiveDate: '2024-01-15',
        currentCompletionDate: '2025-01-14',
        ultimateCompletionDate: '2025-01-14',
        lastModified: '2024-01-15T10:30:00Z',
        
        // Classification
        naicsCode: '334111',
        naicsDescription: 'Electronic Computer Manufacturing',
        pscCode: '7021',
        pscDescription: 'ADP Equipment',
        
        // Contract Details
        descriptionOfRequirement: 'FY24 EPA Laptop Refresh for Dell Laptops, Desktops, and Monitors including setup and deployment services',
        typeOfContract: 'FIRM FIXED PRICE',
        typeOfContractPricing: 'FIRM FIXED PRICE',
        contractActionType: 'NEW WORK',
        reasonForModification: '',
        
        // Competition Information
        extentCompeted: 'FULL AND OPEN COMPETITION',
        reasonNotCompeted: '',
        numberOfOffersReceived: '5',
        
        // Set-Aside Information
        setAsideType: 'SMALL BUSINESS SET ASIDE',
        typeOfSetAside: 'SMALL BUSINESS SET ASIDE',
        
        // Performance Information
        placeOfPerformanceCity: 'Arlington',
        placeOfPerformanceState: 'VA',
        placeOfPerformanceCountry: 'UNITED STATES',
        placeOfPerformanceZip: '22202',
        principalPlaceOfPerformance: 'Arlington, VA',
        
        // Additional Details
        contractingOfficerBusinessSizeDetermination: 'SMALL BUSINESS',
        commercialItemAcquisitionProcedures: 'YES',
        commercialItemTestProgram: 'NO',
        consolidatedContract: 'NO',
        costOrPricingData: 'NO',
        costAccountingStandardsClause: 'NO',
        
        // Socioeconomic Information
        womanOwnedSmallBusiness: 'NO',
        veteranOwnedSmallBusiness: 'NO',
        serviceDisabledVeteranOwnedSmallBusiness: 'NO',
        hubzoneSmallBusiness: 'NO',
        smallDisadvantagedBusiness: 'YES',
        historicallyBlackCollegeOrUniversity: 'NO',
        
        // System Information
        updated: '2024-01-15T10:30:00Z',
        link: 'https://www.fpds.gov/fpdsng_cms/index.php/en/reports/62-atom-feed-files',
        fiscalYear: 2024,
        contractValue: '$4,560,276'
      },
      {
        id: 'fpds_mock_2',
        title: 'EPA IT Equipment and Services',
        piid: '68HERD24F0055',
        contractingAgencyName: 'ENVIRONMENTAL PROTECTION AGENCY',
        vendorName: 'HP Inc.',
        dollarAmount: 2850000.00,
        signedDate: '2024-02-20',
        lastModified: '2024-02-20T14:15:00Z',
        naicsCode: '334111',
        pscCode: '7030',
        descriptionOfRequirement: 'IT Equipment including servers, storage, and networking equipment',
        placeOfPerformanceState: 'DC',
        placeOfPerformanceCity: 'Washington',
        typeOfContract: 'FIRM FIXED PRICE',
        extentCompeted: 'FULL AND OPEN COMPETITION',
        setAsideType: 'NO SET ASIDE USED',
        updated: '2024-02-20T14:15:00Z',
        link: 'https://www.fpds.gov/fpdsng_cms/index.php/en/reports/62-atom-feed-files'
      },
      {
        id: 'fpds_mock_3',
        title: 'EPA Software Licensing and Support',
        piid: '68HERD24F0078',
        contractingAgencyName: 'ENVIRONMENTAL PROTECTION AGENCY',
        vendorName: 'Microsoft Corporation',
        dollarAmount: 1250000.00,
        signedDate: '2024-03-10',
        lastModified: '2024-03-10T09:45:00Z',
        naicsCode: '541511',
        pscCode: '7030',
        descriptionOfRequirement: 'Enterprise software licensing and technical support services',
        placeOfPerformanceState: 'WA',
        placeOfPerformanceCity: 'Redmond',
        typeOfContract: 'FIRM FIXED PRICE',
        extentCompeted: 'FULL AND OPEN COMPETITION',
        setAsideType: 'NO SET ASIDE USED',
        updated: '2024-03-10T09:45:00Z',
        link: 'https://www.fpds.gov/fpdsng_cms/index.php/en/reports/62-atom-feed-files'
      }
    ];

    // Filter mock results based on search criteria
    let filteredResults = mockContracts;

    if (searchCriteria.contractingAgencyName) {
      filteredResults = filteredResults.filter(contract => 
        contract.contractingAgencyName.toLowerCase().includes(searchCriteria.contractingAgencyName.toLowerCase())
      );
    }

    if (searchCriteria.vendorName) {
      filteredResults = filteredResults.filter(contract => 
        contract.vendorName.toLowerCase().includes(searchCriteria.vendorName.toLowerCase())
      );
    }

    if (searchCriteria.dollarAmountFrom) {
      filteredResults = filteredResults.filter(contract => 
        contract.dollarAmount >= searchCriteria.dollarAmountFrom
      );
    }

    if (searchCriteria.dollarAmountTo) {
      filteredResults = filteredResults.filter(contract => 
        contract.dollarAmount <= searchCriteria.dollarAmountTo
      );
    }

    // Store mock results
    this.storeSearchResults(searchCriteria, filteredResults);

    return {
      success: true,
      data: filteredResults,
      total: filteredResults.length,
      searchCriteria,
      timestamp: new Date().toISOString(),
      note: 'Demo results - Connect to FPDS.gov for live data'
    };
  }

  /**
   * Get available NAICS codes for EPA-related contracts
   */
  getCommonNAICSCodes() {
    return [
      { code: '334111', description: 'Electronic Computer Manufacturing' },
      { code: '334112', description: 'Computer Storage Device Manufacturing' },
      { code: '334118', description: 'Computer Terminal and Other Computer Peripheral Equipment Manufacturing' },
      { code: '541511', description: 'Custom Computer Programming Services' },
      { code: '541512', description: 'Computer Systems Design Services' },
      { code: '541513', description: 'Computer Facilities Management Services' },
      { code: '541519', description: 'Other Computer Related Services' },
      { code: '518210', description: 'Data Processing, Hosting, and Related Services' },
      { code: '541330', description: 'Engineering Services' },
      { code: '541620', description: 'Environmental Consulting Services' }
    ];
  }

  /**
   * Get available PSC codes for EPA-related contracts
   */
  getCommonPSCCodes() {
    return [
      { code: '7021', description: 'ADP Equipment' },
      { code: '7025', description: 'ADP Components' },
      { code: '7030', description: 'ADP Software' },
      { code: '7035', description: 'ADP Support Equipment' },
      { code: 'D302', description: 'IT and Telecom - IT and Telecom Solutions' },
      { code: 'D307', description: 'IT and Telecom - Integrated Consulting Services' },
      { code: 'D399', description: 'IT and Telecom - Other IT and Telecommunications' },
      { code: 'R425', description: 'Environmental Services' },
      { code: 'R497', description: 'Environmental Restoration Services' }
    ];
  }
}

// Export singleton instance
const fpdsService = new FPDSService();
export default fpdsService;
