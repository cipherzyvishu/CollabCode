Write-Host "Cleaning up Supabase folder..." -ForegroundColor Cyan

# Navigate to the supabase folder
Set-Location -Path "e:\Collabcode\supabase"

Write-Host "Removing empty files..." -ForegroundColor Yellow
$emptyFiles = @(
    "comprehensive-policy-fix.sql",
    "temp-disable-rls.sql",
    "disable-rls-temp.sql",
    "comprehensive-fix.sql",
    "schema.sql",
    "schema-fixed.sql"
)
foreach ($file in $emptyFiles) {
    Remove-Item $file -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $file)) {
        Write-Host "  - Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  - Failed to remove: $file" -ForegroundColor Red
    }
}

Write-Host "Removing duplicate/redundant files..." -ForegroundColor Yellow
$duplicateFiles = @(
    "temp_disable_rls.sql",
    "disable-rls-code-snapshots.sql"
)
foreach ($file in $duplicateFiles) {
    Remove-Item $file -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $file)) {
        Write-Host "  - Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  - Failed to remove: $file" -ForegroundColor Red
    }
}

Write-Host "Removing debug/test files..." -ForegroundColor Yellow
$debugFiles = @(
    "check-code-snapshots.sql",
    "check-existing-table.sql",
    "check-table-structure.sql",
    "test-schema.sql"
)
foreach ($file in $debugFiles) {
    Remove-Item $file -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $file)) {
        Write-Host "  - Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  - Failed to remove: $file" -ForegroundColor Red
    }
}

Write-Host "Removing partial schema files..." -ForegroundColor Yellow
$partialFiles = @(
    "create-basic-table.sql",
    "create-code-snapshots-simple.sql",
    "create-code-snapshots-table.sql",
    "fix-policies.sql",
    "fix-schema-issues.sql"
)
foreach ($file in $partialFiles) {
    Remove-Item $file -Force -ErrorAction SilentlyContinue
    if (-not (Test-Path $file)) {
        Write-Host "  - Removed: $file" -ForegroundColor Green
    } else {
        Write-Host "  - Failed to remove: $file" -ForegroundColor Red
    }
}

Write-Host "Supabase folder cleanup complete!" -ForegroundColor Green
Write-Host "Only keeping essential files:" -ForegroundColor Cyan
Write-Host "  - schema-complete.sql (full schema)" -ForegroundColor White
Write-Host "  - migrations/ folder (database migrations)" -ForegroundColor White
