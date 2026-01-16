#!/bin/bash

# Bootstrap Super Admin Script
# This script helps you create a super admin user in your Supabase database

set -e

echo "============================================"
echo "Bootstrap Super Admin User"
echo "============================================"
echo ""

# Check if Supabase CLI is installed
if ! command -v supabase &> /dev/null; then
    echo "❌ Supabase CLI is not installed."
    echo "Install it: https://supabase.com/docs/guides/cli/getting-started"
    exit 1
fi

# Get user email
read -p "Enter your email address (used to log in): " USER_EMAIL

if [ -z "$USER_EMAIL" ]; then
    echo "❌ Email is required"
    exit 1
fi

echo ""
echo "Creating super admin for: $USER_EMAIL"
echo ""

# Create temporary SQL file
TEMP_SQL=$(mktemp)
cat > "$TEMP_SQL" <<EOF
DO \$\$
DECLARE
  user_uuid UUID;
  user_email TEXT := '$USER_EMAIL';
BEGIN
  -- Get user ID from auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RAISE EXCEPTION 'User with email % not found. Please sign up first at http://localhost:8080/auth', user_email;
  END IF;
  
  -- Insert or update user role as super admin
  INSERT INTO user_roles (user_id, role, is_super_admin, can_see_financials, is_active, page_permissions)
  VALUES (
    user_uuid,
    'admin',
    true,
    true,
    true,
    '[]'::jsonb
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    role = 'admin',
    is_super_admin = true,
    can_see_financials = true,
    is_active = true,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Super admin created/updated for user: % (ID: %)', user_email, user_uuid;
END \$\$;
EOF

# Execute via Supabase CLI
echo "Executing SQL..."
if supabase db execute -f "$TEMP_SQL"; then
    echo ""
    echo "✅ Success! Super admin created."
    echo ""
    echo "Next steps:"
    echo "1. Refresh your app at http://localhost:8080"
    echo "2. Log in with: $USER_EMAIL"
    echo "3. You should now have full access!"
else
    echo ""
    echo "❌ Failed to create super admin."
    echo ""
    echo "Troubleshooting:"
    echo "1. Make sure you've signed up at http://localhost:8080/auth"
    echo "2. Check Supabase Dashboard → Authentication → Users"
    echo "3. Or use the manual SQL method in README-BOOTSTRAP.md"
    exit 1
fi

# Cleanup
rm "$TEMP_SQL"
