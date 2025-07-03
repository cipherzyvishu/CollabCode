Write-Host "Cleaning up CollabCode project before GitHub commit..." -ForegroundColor Cyan

Write-Host "Removing temporary debug files..." -ForegroundColor Yellow
Remove-Item -Path "debug_render_loop.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "server\test-yjs-connection.js" -Force -ErrorAction SilentlyContinue

Write-Host "Removing empty placeholder files..." -ForegroundColor Yellow
Remove-Item -Path "install-client.bat" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "install-server.bat" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "database-setup.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "SETUP.md" -Force -ErrorAction SilentlyContinue

Write-Host "Cleaning up Supabase folder..." -ForegroundColor Cyan
if (Test-Path -Path ".\supabase\cleanup-supabase.ps1") {
    Write-Host "Running Supabase cleanup script..." -ForegroundColor Yellow
    & ".\supabase\cleanup-supabase.ps1"
} else {
    Write-Host "Supabase cleanup script not found, skipping..." -ForegroundColor Yellow
}

Write-Host "Checking for node_modules folders to exclude from Git..." -ForegroundColor Cyan
if (Test-Path -Path ".\.gitignore") {
    $gitIgnore = Get-Content -Path ".\.gitignore"
    if ($gitIgnore -notcontains "node_modules/" -and $gitIgnore -notcontains "*/node_modules/") {
        Write-Host "Adding node_modules to .gitignore..." -ForegroundColor Yellow
        Add-Content -Path ".\.gitignore" -Value "`n# Dependencies`nnode_modules/`n*/node_modules/"
    } else {
        Write-Host "node_modules already in .gitignore, skipping..." -ForegroundColor Green
    }
}

Write-Host "Cleanup complete! You can now commit your clean project to GitHub." -ForegroundColor Green
Write-Host "The following key files and directories remain:" -ForegroundColor Cyan
Write-Host "  - client/ (Next.js frontend)" -ForegroundColor White
Write-Host "  - server/ (Socket.IO backend)" -ForegroundColor White
Write-Host "  - shared/ (Shared types and utilities)" -ForegroundColor White
Write-Host "  - supabase/schema-complete.sql (Database schema)" -ForegroundColor White
Write-Host "  - supabase/migrations/ (Database migrations)" -ForegroundColor White
Write-Host "  - README.md (Project documentation)" -ForegroundColor White
