@echo off
REM Tests firestore.rules against a LOCAL emulator (project "demo-sagaysync").
REM It never connects to the real sagaysync project and deploys nothing.
REM
REM First run downloads: npm packages into rules-test\node_modules, firebase-tools (via npx),
REM and the Firestore emulator (~60 MB, cached in %USERPROFILE%\.cache\firebase).
REM Needs Java 21+ installed (the emulator is a Java program).
REM Results: rules-test\rules-test.log
cd /d "%~dp0"
set LOG=%~dp0rules-test.log
echo === SagaySync rules tests %DATE% %TIME% === > "%LOG%"

where java >nul 2>&1
if errorlevel 1 (
  echo JAVA: NOT FOUND - install a JDK 21+, e.g. from adoptium.net, then run this again. >> "%LOG%"
  type "%LOG%"
  pause
  exit /b 1
)
java -version >> "%LOG%" 2>&1

echo --- npm install --- >> "%LOG%"
call npm install --no-audit --no-fund >> "%LOG%" 2>&1
if errorlevel 1 (echo NPM INSTALL: FAILED >> "%LOG%" & type "%LOG%" & pause & exit /b 1)

echo --- tests --- >> "%LOG%"
cd /d "%~dp0.."
call npx -y firebase-tools@15 emulators:exec --only firestore --project demo-sagaysync "node --test rules-test/rules.test.mjs" >> "%LOG%" 2>&1
if errorlevel 1 (echo RULES TESTS: FAILED >> "%LOG%") else (echo RULES TESTS: PASSED >> "%LOG%")
echo === done === >> "%LOG%"
type "%LOG%"
pause
