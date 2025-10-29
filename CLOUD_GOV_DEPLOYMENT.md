# Deploying EPA OID Planning and Management Tool to cloud.gov

This guide provides step-by-step instructions for deploying the EPA OID Planning and Management Tool application to cloud.gov using the cloud.gov CLI.

## Prerequisites

1. A cloud.gov account with access to the target organization and space
2. Cloud Foundry CLI installed on your local machine
3. Access to the cloud.gov API endpoint

## Setup cloud.gov CLI

1. Install the Cloud Foundry CLI if you haven't already:
   - For Windows: Download from https://github.com/cloudfoundry/cli/releases
   - For macOS: `brew install cloudfoundry/tap/cf-cli`
   - For Linux: Follow instructions at https://docs.cloudfoundry.org/cf-cli/install-go-cli.html

2. Connect to cloud.gov:
   ```
   cf login -a api.fr.cloud.gov --sso
   ```

3. Follow the prompts to log in via the web browser and select your organization and space.

## Data Persistence

This application uses client-side localStorage for data persistence and does not require any database services. All data is stored in the user's browser and persists across sessions.

Key features of the localStorage implementation:
- Persistent data across browser sessions
- Real-time analytics generation from stored data
- Activity logging for all user actions
- Data export/import functionality for backup/restore

## Deploy the Application

1. If you want to delete any existing application before deploying:
   ```
   cf delete -f epa-invoice-analytics
   ```
   This ensures a clean deployment without any conflicts from previous versions.

2. From the root directory of the project, deploy the application:
   ```
   cf push
   ```

3. The deployment will use the settings in the `manifest.yml` file.

> **Note:** The deployment scripts (`deploy-cloud-gov.bat` and `deploy-cloud-gov.sh`) automatically check for and delete any existing application before deploying.

## Set Environment Variables

Set the required environment variables:

```
cf set-env epa-invoice-analytics NODE_ENV production
cf set-env epa-invoice-analytics OPENAI_API_KEY your-openai-api-key
cf set-env epa-invoice-analytics JWT_SECRET your-jwt-secret
```

For sensitive environment variables like API keys, use cloud.gov's service key approach:

```
cf cups epa-secrets -p '{"OPENAI_API_KEY":"your-key", "JWT_SECRET":"your-secret"}'
cf bind-service epa-invoice-analytics epa-secrets
```

## Restart the Application

After setting environment variables, restart the application:

```
cf restart epa-invoice-analytics
```

## Access the Application

Once deployed, the application will be available at:
```
https://epa-invoice-analytics.app.cloud.gov
```

## Monitoring and Logs

View application logs:
```
cf logs epa-invoice-analytics --recent
```

Stream logs in real-time:
```
cf logs epa-invoice-analytics
```

## Updating the Application

To update the application after making changes:

1. Commit your changes to version control
2. Push the updated code to cloud.gov:
   ```
   cf push
   ```

## Troubleshooting

If the application fails to start:

1. Check the logs:
   ```
   cf logs epa-invoice-analytics --recent
   ```

2. Verify the services are properly bound:
   ```
   cf services
   ```

3. Ensure all required environment variables are set:
   ```
   cf env epa-invoice-analytics
   ```

## Additional Resources

- [Cloud.gov documentation](https://cloud.gov/docs/)
- [Cloud Foundry CLI documentation](https://docs.cloudfoundry.org/cf-cli/)
- [Cloud.gov service documentation](https://cloud.gov/docs/services/intro/)
