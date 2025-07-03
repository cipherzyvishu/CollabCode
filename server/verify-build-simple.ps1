# Simple version of verify-build script for Windows PowerShell
Write-Host "Running build verification for CollabCode server..."

# Clean any previous builds
Write-Host "Cleaning previous builds..."
npm run clean

# Try to build using the same command Railway will use
Write-Host "Building with npx tsc..."
if (!(Test-Path -Path "dist")) {
    New-Item -ItemType Directory -Path "dist"
}
npx tsc

# Check if the build artifacts exist
Write-Host "Checking build artifacts..."
if (Test-Path -Path "./dist/src/index.js") {
    Write-Host "Build successful! Build artifacts exist."
} else {
    Write-Host "Build artifacts not found. Build may have failed."
    exit 1
}

Write-Host "Verification completed successfully!"
Write-Host "Next steps:"
Write-Host "1. Commit these changes to GitHub"
Write-Host "2. Trigger a new deployment on Railway"
Write-Host "3. Update the client environment variables with the Railway URL"
