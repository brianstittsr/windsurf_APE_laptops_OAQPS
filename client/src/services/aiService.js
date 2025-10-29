import localStorageService from './localStorageService';

class AIService {
  getSettings() {
    const settings = localStorageService.getSettings();
    
    console.log('Raw settings from localStorage:', settings); // Debug log
    
    // Check if we have AI keys configured and get the default one
    if (settings.aiKeys && settings.aiKeys.length > 0) {
      console.log('Available AI keys:', settings.aiKeys); // Debug log
      
      const defaultKey = settings.aiKeys.find(key => key.isDefault) || settings.aiKeys[0];
      console.log('Selected default key:', defaultKey); // Debug log
      
      if (defaultKey) {
        const aiSettings = {
          provider: defaultKey.provider,
          model: defaultKey.model,
          apiKey: defaultKey.apiKey,
          endpoint: defaultKey.endpoint || this.getDefaultEndpoint(defaultKey.provider),
          temperature: settings.aiSettings?.temperature || 0.3,
          maxTokens: settings.aiSettings?.maxTokens || 2000,
          systemPrompt: settings.aiSettings?.systemPrompt || this.getDefaultSystemPrompt()
        };
        console.log('Final AI settings:', aiSettings); // Debug log
        return aiSettings;
      }
    }
    
    // Fallback to stored AI settings or defaults
    const defaultSettings = {
      provider: 'openai',
      model: 'gpt-4-turbo',
      apiKey: '',
      endpoint: '',
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: this.getDefaultSystemPrompt()
    };
    
    return settings.aiSettings || defaultSettings;
  }

  getDefaultEndpoint(provider) {
    const endpoints = {
      openai: 'https://api.openai.com/v1/chat/completions',
      anthropic: 'https://api.anthropic.com/v1/messages',
      google: 'https://generativelanguage.googleapis.com/v1beta/models',
      azure: '', // Azure endpoints are custom
      ollama: 'http://localhost:11434/v1/chat/completions'
    };
    return endpoints[provider] || '';
  }

  getDefaultSystemPrompt() {
    return `You are an advanced AI analyst specialized in EPA contract and procurement data analysis with forecasting capabilities. 

CAPABILITIES:
- Deep analysis of contract patterns, trends, and anomalies
- Predictive forecasting for future procurement needs
- Natural language querying of contract data

RESPONSE FORMATTING:
- Use Markdown for all formatting (e.g., lists, bolding, code blocks) to improve readability.
- Present complex data in a clear, structured manner.

ANALYSIS APPROACH:
- Use statistical analysis and trend identification
- Provide data-driven forecasts with confidence intervals
- Identify seasonal patterns and cyclical trends
- Highlight potential risks and opportunities
- Generate actionable recommendations

RESPONSE FORMAT:
- Start with executive summary
- Provide detailed analysis with supporting data
- Include forecasts with methodology explanation
- End with specific recommendations
- Use clear, professional language suitable for government stakeholders`;
  }

  updateSettings(newSettings) {
    const settings = localStorageService.getSettings();
    settings.aiSettings = newSettings;
    localStorageService.updateSettings(settings);
  }

  async queryAI(message, includeData = true) {
    const settings = this.getSettings();
    
    console.log('AI Settings:', settings); // Debug log
    
    // Check if we have a valid API key
    if (!settings.apiKey || settings.apiKey.length < 10) {
      console.log('No valid API key found, using demo response');
      const analytics = localStorageService.generateAnalytics();
      return this.generateDemoResponse(message, analytics);
    }
    
    console.log(`Using ${settings.provider} with model ${settings.model}`);
    
    try {
      // Get current data context if requested
      let contextData = '';
      if (includeData) {
        const analytics = localStorageService.generateAnalytics();
        const invoices = localStorageService.getInvoices();
        
        contextData = `\n\nCURRENT DATA CONTEXT:
Total Invoices: ${analytics.totalInvoices}
Total Contract Value: $${analytics.totalValue.toLocaleString()}
Average Contract Value: $${analytics.averageValue.toLocaleString()}

Fiscal Year Breakdown:
${Object.entries(analytics.byFiscalYear).map(([year, data]) => 
  `- FY${year}: ${data.count} contracts, $${data.value.toLocaleString()}`
).join('\n')}

Schema Distribution:
${Object.entries(analytics.bySchema).map(([schema, data]) => 
  `- ${schema}: ${data.count} contracts, $${data.value.toLocaleString()}`
).join('\n')}

Recent Sample Contracts:
${invoices.slice(0, 3).map(inv => 
  `- ${inv.vendorName}: $${inv.totalAwardAmount.toLocaleString()} (FY${inv.fiscalYear})`
).join('\n')}`;
      }

      // Use backend proxy to avoid CORS issues
      const response = await fetch('http://localhost:5001/api/chat/ai-proxy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          provider: settings.provider,
          model: settings.model,
          apiKey: settings.apiKey,
          message: message + contextData,
          systemPrompt: settings.systemPrompt,
          temperature: settings.temperature,
          maxTokens: settings.maxTokens
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.error?.message || JSON.stringify(errorData.error);
        throw new Error(`${settings.provider} API error: ${response.status} - ${errorMessage}`);
      }

      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('AI Service Error:', error);
      
      // Provide demo-friendly fallback responses
      if (includeData) {
        const analytics = localStorageService.generateAnalytics();
        return this.generateDemoResponse(message, analytics);
      }
      
      return `I apologize, but I'm having trouble connecting to the AI service. Error: ${error.message}. 

For demo purposes, here's what I can tell you about your EPA contract data:
- You have ${localStorageService.getInvoices().length} contracts loaded
- Total value: $${localStorageService.generateAnalytics().totalValue.toLocaleString()}
- Please check your API key configuration for full AI analysis.`;
    }
  }

  generateDemoResponse(message, analytics) {
    const lowerMessage = message.toLowerCase();
    const settings = this.getSettings();
    const providerName = this.getProviderDisplayName(settings.provider);
    const modelName = this.getModelDisplayName(settings.model);
    
    if (lowerMessage.includes('forecast') || lowerMessage.includes('budget')) {
      return `# 📊 EPA Procurement Forecast Report (Demo Mode)

## Executive Summary
Based on your current EPA contract data (${analytics.totalInvoices} contracts, $${analytics.totalValue.toLocaleString()} total value), here's a comprehensive forecast:

## Key Findings
- **Historical Trend**: Average contract value of $${analytics.averageValue.toLocaleString()}
- **Fiscal Year Distribution**: ${Object.keys(analytics.byFiscalYear).length} fiscal years represented
- **Schema Diversity**: ${Object.keys(analytics.bySchema).length} different contract schemas

## Budget Projections (Next FY)
- **Estimated Spending**: $${(analytics.totalValue * 1.15).toLocaleString()} (+15% growth)
- **Contract Volume**: ~${Math.ceil(analytics.totalInvoices * 1.1)} contracts expected
- **Average Contract Size**: $${(analytics.averageValue * 1.05).toLocaleString()}

## Risk Assessment
- **Medium Risk**: Vendor concentration in top performers
- **Low Risk**: Diversified contract portfolio
- **Recommendation**: Continue current procurement strategy

*Note: This is a demo response. Connect your ${providerName} API key for advanced AI analysis.*`;
    }
    
    if (lowerMessage.includes('trend') || lowerMessage.includes('pattern')) {
      return `# 📈 EPA Procurement Trend Analysis (Demo Mode)

## Spending Patterns Identified
${Object.entries(analytics.byFiscalYear).map(([year, data]) => 
  `- **FY${year}**: ${data.count} contracts, $${data.value.toLocaleString()} total`
).join('\n')}

## Schema Distribution Trends
${Object.entries(analytics.bySchema).map(([schema, data]) => 
  `- **${schema}**: ${data.count} contracts (${((data.count/analytics.totalInvoices)*100).toFixed(1)}%)`
).join('\n')}

## Key Insights
- **Growth Rate**: Steady procurement volume
- **Seasonal Patterns**: Q1 and Q4 typically higher activity
- **Contract Size**: Consistent with federal procurement guidelines

## Recommendations
1. Maintain current diversification strategy
2. Plan for 10-15% budget increase next FY
3. Consider bulk procurement opportunities

*Note: This is a demo response. Connect your ${providerName} API key for advanced statistical analysis.*`;
    }
    
    if (lowerMessage.includes('risk') || lowerMessage.includes('assessment')) {
      return `# ⚠️ EPA Procurement Risk Assessment (Demo Mode)

## Risk Profile: **MODERATE**

### Financial Risks
- **Budget Variance**: Low risk (±5% historical variance)
- **Cost Escalation**: Medium risk (inflation impact)
- **Funding Continuity**: Low risk (federal backing)

### Vendor Risks
- **Concentration Risk**: Medium (top 3 vendors = 60% of spend)
- **Performance Risk**: Low (established vendor relationships)
- **Compliance Risk**: Low (government contractor requirements)

### Operational Risks
- **Delivery Risk**: Low (proven supply chains)
- **Quality Risk**: Low (federal quality standards)
- **Technology Risk**: Medium (rapid tech evolution)

## Mitigation Strategies
1. **Diversify vendor base** - Add 2-3 new qualified vendors
2. **Implement price monitoring** - Track market rates quarterly
3. **Enhance contract terms** - Include inflation adjustment clauses

## Key Risk Indicators to Monitor
- Vendor financial health scores
- Market price volatility
- Delivery performance metrics

*Note: This is a demo response. Connect your ${providerName} API key for comprehensive risk modeling.*`;
    }
    
    // Default response
    return `# 🤖 EPA Contract Analysis (Demo Mode)

## Current Portfolio Overview
- **Total Contracts**: ${analytics.totalInvoices}
- **Total Value**: $${analytics.totalValue.toLocaleString()}
- **Average Contract**: $${analytics.averageValue.toLocaleString()}

## Fiscal Year Breakdown
${Object.entries(analytics.byFiscalYear).map(([year, data]) => 
  `- **FY${year}**: ${data.count} contracts, $${data.value.toLocaleString()}`
).join('\n')}

## Contract Types
${Object.entries(analytics.bySchema).map(([schema, data]) => 
  `- **${schema}**: ${data.count} contracts`
).join('\n')}

## Quick Insights
- Portfolio shows healthy diversification
- Spending patterns align with federal guidelines
- Strong vendor performance indicators

*Note: This is a demo response. Connect your ${providerName} API key for advanced AI-powered analysis with ${modelName}.*`;
  }

  async generateForecastReport(type = 'comprehensive') {
    try {
      const forecastPrompts = {
        comprehensive: `Generate a comprehensive procurement forecast report including:
1. Executive Summary with key findings
2. Historical trend analysis (3-year outlook)
3. Budget forecasting for next fiscal year
4. Risk assessment and mitigation strategies
5. Vendor performance predictions
6. Seasonal spending patterns
7. Compliance and regulatory outlook
8. Strategic recommendations for procurement optimization`,
        
        budget: `Create a detailed budget forecast focusing on:
1. Projected spending for next fiscal year
2. Category-wise budget allocation recommendations
3. Cost optimization opportunities
4. Risk factors affecting budget
5. Quarterly spending projections`,
        
        vendor: `Analyze vendor performance and provide:
1. Top performing vendors analysis
2. Vendor risk assessment
3. Market competition analysis
4. Vendor diversification recommendations
5. Contract renewal strategies`
      };

      return await this.queryAI(forecastPrompts[type] || forecastPrompts.comprehensive);
    } catch (error) {
      const analytics = localStorageService.generateAnalytics();
      return this.generateDemoResponse('forecast report', analytics);
    }
  }

  getProviderDisplayName(provider) {
    const providerNames = {
      openai: 'OpenAI',
      anthropic: 'Anthropic',
      google: 'Google AI',
      azure: 'Azure OpenAI',
      ollama: 'Ollama (Local)'
    };
    return providerNames[provider] || provider;
  }

  getModelDisplayName(model) {
    const modelNames = {
      'gpt-3.5-turbo': 'GPT-3.5 Turbo',
      'gpt-4': 'GPT-4',
      'gpt-4-turbo': 'GPT-4 Turbo',
      'gpt-4o': 'GPT-4o',
      'gpt-4o-mini': 'GPT-4o Mini',
      'claude-3-haiku-20240307': 'Claude 3 Haiku',
      'claude-3-sonnet-20240229': 'Claude 3 Sonnet',
      'claude-3-opus-20240229': 'Claude 3 Opus',
      'claude-3-5-sonnet-20240620': 'Claude 3.5 Sonnet',
      'gemini-pro': 'Gemini Pro',
      'gemini-pro-vision': 'Gemini Pro Vision',
      'gemini-1.5-pro': 'Gemini 1.5 Pro',
      'gemini-1.5-flash': 'Gemini 1.5 Flash',
      'llama3': 'Llama 3',
      'mistral': 'Mistral',
      'codellama': 'Code Llama',
      'llava': 'LLaVA'
    };
    return modelNames[model] || model;
  }

  async testDataApi(api, keys) {
    try {
      const response = await fetch('/api/chat/data-api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ api, ...keys })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testConnection(provider, apiKey, endpoint, model) {
    try {
      const response = await fetch('http://localhost:5001/api/chat/ai-proxy/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ provider, model, apiKey, endpoint })
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.error || `HTTP ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async generateTrendAnalysis() {
    try {
      const prompt = `Perform advanced trend analysis on the EPA procurement data:
1. Identify spending patterns and cyclical trends
2. Analyze year-over-year growth rates
3. Detect anomalies or unusual spending patterns
4. Evaluate contract size distribution trends
5. Assess vendor concentration risks
6. Provide clear, concise, and actionable insights, formatted for leadership consumption. Use Markdown for formatting (e.g., lists, bolding, code blocks) to improve readability.
7. Recommend data-driven procurement strategies`;

      return await this.queryAI(prompt);
    } catch (error) {
      const analytics = localStorageService.generateAnalytics();
      return this.generateDemoResponse('trend analysis', analytics);
    }
  }

  async generateRiskAssessment() {
    try {
      const prompt = `Conduct a comprehensive risk assessment:
1. Financial risk analysis (budget overruns, cost escalation)
2. Vendor risk evaluation (concentration, performance, compliance)
3. Operational risks (delivery delays, quality issues)
4. Regulatory compliance risks
5. Market volatility impact assessment
6. Risk mitigation strategies with priority rankings
7. Key risk indicators to monitor`;

      return await this.queryAI(prompt);
    } catch (error) {
      const analytics = localStorageService.generateAnalytics();
      return this.generateDemoResponse('risk assessment', analytics);
    }
  }

  getAvailableProviders() {
    return [
      {
        id: 'openai',
        name: 'OpenAI',
        models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo'],
        endpoint: 'https://api.openai.com/v1/chat/completions',
        requiresAuth: true
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229', 'claude-3-5-sonnet-20240620'],
        endpoint: 'https://api.anthropic.com/v1/messages',
        requiresAuth: true
      },
      {
        id: 'ollama',
        name: 'Ollama (Local)',
        models: ['llama3', 'mistral', 'codellama', 'llava'],
        endpoint: 'http://localhost:11434/v1/chat/completions',
        requiresAuth: false
      }
    ];
  }
}

const aiService = new AIService();
export default aiService;