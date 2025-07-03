@echo off
echo Cleaning up Supabase folder...

echo Removing empty files...
del /q comprehensive-policy-fix.sql temp-disable-rls.sql disable-rls-temp.sql comprehensive-fix.sql schema.sql schema-fixed.sql

echo Removing duplicate/redundant files...
del /q temp_disable_rls.sql disable-rls-code-snapshots.sql

echo Removing debug/test files...
del /q check-code-snapshots.sql check-existing-table.sql check-table-structure.sql test-schema.sql

echo Removing partial schema files...
del /q create-basic-table.sql create-code-snapshots-simple.sql create-code-snapshots-table.sql fix-policies.sql fix-schema-issues.sql

echo Supabase folder cleanup complete!
echo Only keeping essential files:
echo   - schema-complete.sql (full schema)
echo   - migrations/ folder (database migrations)
