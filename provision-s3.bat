@echo off

REM Set path to local CF executable
SET CF_EXE=.\cf-cli-temp\cf.exe

REM Login and target
%CF_EXE% login -a api.fr.cloud.gov --sso
%CF_EXE% target -o epa-prototyping -s admin-training

REM Create the S3 service instance
%CF_EXE% create-service s3 basic epa-laptops-oaqps

REM Bind the service to the application
%CF_EXE% bind-service epa-oid-analytics epa-laptops-oaqps

REM Restage the application to apply the binding
%CF_EXE% restage epa-oid-analytics

echo S3 bucket 'epa-laptops-oaqps' has been provisioned and bound to the application.
