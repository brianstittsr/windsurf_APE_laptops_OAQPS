#!/bin/bash

echo "===== EPA Invoice Analytics Cloud.gov Deployment ====="

echo "Logging in to cloud.gov..."
cf login -a api.fr.cloud.gov --sso

echo "Application uses localStorage for data persistence - no database service required."

echo "Building application..."
npm run build

echo "Checking if application already exists..."
if cf app epa-invoice-analytics &>/dev/null; then
  echo "Deleting existing application..."
  cf delete -f epa-invoice-analytics
  echo "Waiting for deletion to complete..."
  sleep 5
fi

echo "Deploying application to cloud.gov..."
cf push

echo "Setting environment variables..."
cf set-env epa-invoice-analytics NODE_ENV production

echo "Restarting application..."
cf restart epa-invoice-analytics

echo "Deployment complete! Your application should be available at:"
echo "https://epa-invoice-analytics.app.cloud.gov"

echo "To view logs, run: cf logs epa-invoice-analytics --recent"
