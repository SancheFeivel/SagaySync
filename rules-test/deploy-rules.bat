@echo off
REM Deploys ONLY firestore.rules to the real "sagaysync" project (indexes and data are untouched).
REM Run run-rules-tests.bat first and only deploy when it says RULES TESTS: PASSED.
REM Needs a Firebase CLI login (npx firebase-tools@15 login) with access to the project.
REM Results: rules-test\deploy-rules.log
cd /d "%~dp0.."
set LOG=%~dp0deploy-rules.log
echo === SagaySync rules deploy %DATE% %TIME% === > "%LOG%"
call npx -y firebase-tools@15 deploy --only firestore:rules --project sagaysync --non-interactive >> "%LOG%" 2>&1
if errorlevel 1 (echo DEPLOY: FAILED >> "%LOG%") else (echo DEPLOY: DONE >> "%LOG%")
echo === done === >> "%LOG%"
type "%LOG%"
pause
