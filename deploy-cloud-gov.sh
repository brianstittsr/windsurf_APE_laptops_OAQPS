#!/bin/bash

echo "===== EPA OID Planning and Management Tool Cloud.gov Deployment ====="

echo "Logging in to cloud.gov..."
cf login -a api.fr.cloud.gov --sso

echo "Application uses localStorage for data persistence - no database service required."

echo "Building application..."
npm run build

echo "Checking if application already exists..."
if cf app epa-oid-analytics &>/dev/null; then
  echo "Deleting existing application..."
  cf delete -f epa-oid-analytics
  echo "Waiting for deletion to complete..."
  sleep 5
fi

echo "Deploying application to cloud.gov..."
cf push

echo "Setting environment variables..."
cf set-env epa-oid-analytics NODE_ENV production

echo "Restarting application..."
cf restart epa-oid-analytics

echo "Deployment complete! Your application should be available at:"
echo "https://epa-oid-analytics.app.cloud.gov"

echo "To view logs, run: cf logs epa-oid-analytics --recent"
