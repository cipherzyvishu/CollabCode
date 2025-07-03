# Supabase Folder Cleanup

The following files are unnecessary and can be safely removed:

1. Empty SQL files:
   - `comprehensive-policy-fix.sql`
   - `temp-disable-rls.sql` 
   - `disable-rls-temp.sql`
   - `comprehensive-fix.sql`
   - `schema.sql` 
   - `schema-fixed.sql`

2. Duplicate or redundant RLS files:
   - `temp-disable-rls.sql` and `temp_disable_rls.sql` (duplicates)
   - `disable-rls-code-snapshots.sql` (functionality included in `temp_disable_rls.sql`)

3. Debug/test files:
   - `check-code-snapshots.sql` (debug query)
   - `check-existing-table.sql` (debug query)
   - `check-table-structure.sql` (debug query)
   - `test-schema.sql` (test file)

4. Partial schema files (since `schema-complete.sql` contains everything):
   - `create-basic-table.sql`
   - `create-code-snapshots-simple.sql`
   - `create-code-snapshots-table.sql`
   - `fix-policies.sql` (already applied in migrations)
   - `fix-schema-issues.sql` (already applied)

## What to Keep

Keep only these essential files:
- `schema-complete.sql` (the complete database schema)
- The `migrations/` directory with all migration files

## Clean Up Command

Run this PowerShell command to clean up the Supabase folder:

```powershell
# Navigate to the supabase folder
cd e:\Collabcode\supabase

# Remove empty files
Remove-Item comprehensive-policy-fix.sql, temp-disable-rls.sql, disable-rls-temp.sql, comprehensive-fix.sql, schema.sql, schema-fixed.sql -Force

# Remove duplicate/redundant files
Remove-Item temp_disable_rls.sql, disable-rls-code-snapshots.sql -Force

# Remove debug/test files
Remove-Item check-code-snapshots.sql, check-existing-table.sql, check-table-structure.sql, test-schema.sql -Force

# Remove partial schema files
Remove-Item create-basic-table.sql, create-code-snapshots-simple.sql, create-code-snapshots-table.sql, fix-policies.sql, fix-schema-issues.sql -Force
```

This will leave only the complete schema file and migrations folder, which are essential for the project.
