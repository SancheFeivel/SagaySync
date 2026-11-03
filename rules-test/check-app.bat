@echo off
REM Type-checks and lints the app. Uses only what is already in node_modules: no downloads.
REM Results: rules-test\check-app.log
cd /d "%~dp0.."
set LOG=rules-test\check-app.log
echo === SagaySync app check %DATE% %TIME% === > %LOG%
echo. >> %LOG%
echo --- TypeScript (tsc) --- >> %LOG%
call node_modules\.bin\tsc -p rules-test\tsconfig.check.json >> %LOG% 2>&1
if errorlevel 1 (echo TSC: FAILED >> %LOG%) else (echo TSC: PASSED >> %LOG%)
echo. >> %LOG%
echo --- ESLint --- >> %LOG%
call node_modules\.bin\eslint . --ignore-pattern "_to_delete/" --ignore-pattern "rules-test/" >> %LOG% 2>&1
if errorlevel 1 (echo LINT: FAILED >> %LOG%) else (echo LINT: PASSED >> %LOG%)
echo. >> %LOG%
echo === done === >> %LOG%
type %LOG%
pause
