@echo off
echo.
echo 🔧 CollabCode Server Environment Setup
echo =====================================
echo.

echo This script will help you set up your environment variables.
echo You'll need your Supabase project credentials.
echo.

echo 📋 What you need:
echo   1. Supabase Project URL (from Settings -^> API)
echo   2. Supabase Service Role Key (from Settings -^> API)
echo.

pause

echo.
echo 🔑 Getting your credentials:
echo   1. Go to https://supabase.com/dashboard
echo   2. Select your CollabCode project
echo   3. Go to Settings -^> API
echo   4. Copy the Project URL and service_role key
echo.

pause

echo.
set /p SUPABASE_URL="Enter your Supabase Project URL: "
set /p SUPABASE_KEY="Enter your Supabase Service Role Key: "

echo.
echo Updating .env file...

(
echo # Socket.IO Server Environment Variables
echo PORT=3001
echo NODE_ENV=development
echo.
echo # Supabase Configuration
echo SUPABASE_URL=%SUPABASE_URL%
echo SUPABASE_SERVICE_ROLE_KEY=%SUPABASE_KEY%
echo.
echo # CORS Configuration
echo ALLOWED_ORIGINS=http://localhost:3000
echo.
echo # Logging
echo LOG_LEVEL=info
) > .env

echo.
echo ✅ Environment setup complete!
echo.
echo Your .env file has been updated with:
echo   - SUPABASE_URL: %SUPABASE_URL%
echo   - Service role key: [HIDDEN]
echo.
echo Next steps:
echo   1. Run 'npm install' to install dependencies
echo   2. Run 'npm run dev' to start the server
echo.

pause
