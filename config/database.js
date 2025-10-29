/**
 * Database configuration for cloud.gov deployment
 * This file handles parsing the VCAP_SERVICES environment variable
 * to extract database credentials provided by cloud.gov
 */

function getDatabaseConfig() {
  // Check if running on cloud.gov
  if (process.env.VCAP_SERVICES) {
    try {
      const vcapServices = JSON.parse(process.env.VCAP_SERVICES);
      
      // Look for PostgreSQL service
      if (vcapServices['aws-rds']) {
        const credentials = vcapServices['aws-rds'][0].credentials;
        
        return {
          host: credentials.host,
          port: credentials.port,
          database: credentials.db_name,
          user: credentials.username,
          password: credentials.password,
          ssl: { rejectUnauthorized: false }
        };
      }
    } catch (error) {
      console.error('Error parsing VCAP_SERVICES:', error);
    }
  }
  
  // Default to local configuration if not on cloud.gov
  return {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'epa_invoices',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
  };
}

module.exports = {
  getDatabaseConfig
};
