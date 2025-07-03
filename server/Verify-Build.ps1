# PowerShell script to verify the build process works correctly

# Set up colors for output
$Green = @{ForegroundColor = "Green"}
$Red = @{ForegroundColor = "Red"}
$Yellow = @{ForegroundColor = "Yellow"}

Write-Host "🔍 Verifying build process for CollabCode server..." @Yellow

# Clean any previous builds
Write-Host "Cleaning previous builds..." @Yellow
npm run clean

# Check if npx is available
Write-Host "Checking if npx is available..." @Yellow
try {
    npx --version | Out-Null
    Write-Host "✅ npx is available" @Green
} catch {
    Write-Host "❌ npx not found. Please install Node.js >= 20.0.0" @Red
    exit 1
}

# Check if TypeScript is installed
Write-Host "Checking if TypeScript is installed..." @Yellow
$tsInstalled = npm list typescript
if ($tsInstalled -like "*typescript*") {
    Write-Host "✅ TypeScript is installed" @Green
} else {
    Write-Host "❌ TypeScript not found in dependencies" @Red
    Write-Host "Installing TypeScript..." @Yellow
    npm install typescript
}

# Try to build using the same command Railway will use
Write-Host "Attempting to build using Railway's build command..." @Yellow
if (!(Test-Path -Path "dist")) {
    New-Item -ItemType Directory -Path "dist" | Out-Null
}
npx tsc
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Build successful!" @Green
} else {
    Write-Host "❌ Build failed. See errors above." @Red
    exit 1
}

# Check if the build artifacts exist
Write-Host "Checking build artifacts..." @Yellow
if (Test-Path -Path "./dist/src/index.js") {
    Write-Host "✅ Build artifacts exist" @Green
} else {
    Write-Host "❌ Build artifacts not found. Build may have failed." @Red
    exit 1
}

Write-Host "🎉 Verification completed successfully! The build process should work on Railway." @Green
Write-Host "Next steps:" @Yellow
Write-Host "1. Commit these changes to GitHub"
Write-Host "2. Trigger a new deployment on Railway" 
Write-Host "3. Update the client environment variables with the Railway URL"
