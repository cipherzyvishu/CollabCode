@echo off
echo Cleaning up CollabCode project before GitHub commit...

echo Removing temporary debug files...
del /q debug_render_loop.js
del /q server\test-yjs-connection.js

echo Removing empty placeholder files...
del /q install-client.bat
del /q install-server.bat
del /q database-setup.sql
del /q SETUP.md

echo Cleaning up Supabase folder...
cd supabase
echo Removing empty files...
del /q comprehensive-policy-fix.sql temp-disable-rls.sql disable-rls-temp.sql comprehensive-fix.sql schema.sql schema-fixed.sql
echo Removing duplicate/redundant files...
del /q temp_disable_rls.sql disable-rls-code-snapshots.sql
echo Removing debug/test files...
del /q check-code-snapshots.sql check-existing-table.sql check-table-structure.sql test-schema.sql
echo Removing partial schema files...
del /q create-basic-table.sql create-code-snapshots-simple.sql create-code-snapshots-table.sql fix-policies.sql fix-schema-issues.sql
cd ..

echo Cleanup complete! You can now commit your clean project to GitHub.
echo The following key files and directories remain:
echo   - client/ (Next.js frontend)
echo   - server/ (Socket.IO backend)
echo   - shared/ (Shared types and utilities)
echo   - supabase/schema-complete.sql (Database schema)
echo   - supabase/migrations/ (Database migrations)
echo   - README.md (Project documentation)
