@echo off
echo ===== EPA OID Planning and Management Tool Cloud.gov Deployment =====

REM Set path to local CF executable
SET CF_EXE=.\cf-cli-temp\cf.exe

echo Logging in to cloud.gov...
%CF_EXE% login -a api.fr.cloud.gov --sso -o epa-prototyping -s admin-training

echo Application uses localStorage for data persistence - no database service required.

echo Running security audit and fix. The script will continue regardless of the outcome...
cmd /c "npm audit fix --force"

echo Staging, committing, and pushing any security fixes...
cmd /c "git add . && git commit -m \"build: apply automated security audit fixes\" && git push || exit /b 0"

echo Building client application locally...
call .\build-client.bat

echo Checking if application already exists...
%CF_EXE% app epa-oid-analytics > nul 2>&1
if not errorlevel 1 (
  echo Deleting existing application...
  %CF_EXE% delete -f epa-oid-analytics
  echo Waiting for deletion to complete...
  timeout /t 5 /nobreak > nul
)

echo Deploying application to cloud.gov...
%CF_EXE% push

echo Setting environment variables...
%CF_EXE% set-env epa-oid-analytics NODE_ENV production

echo Restarting application...
%CF_EXE% restart epa-oid-analytics

echo Deployment complete! Your application should be available at:
echo https://epa-oid-analytics.app.cloud.gov

echo To view logs, run: %CF_EXE% logs epa-oid-analytics --recent
