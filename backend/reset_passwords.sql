-- Reset all user passwords to 123456789
-- Password hash for "123456789" using Django's PBKDF2 algorithm
-- Generated with: python -c "from django.contrib.auth.hashers import make_password; print(make_password('123456789'))"

-- Note: You'll need to generate the hash first, then update here
-- For now, here's a Python script to do it:

UPDATE users
SET password = 'pbkdf2_sha256$600000$' || substr(md5(random()::text), 1, 22) || '$' || 'PLACEHOLDER'
WHERE 1=0; -- Disabled for safety

-- IMPORTANT: Run this Python command instead to properly hash passwords:
-- python manage.py reset_passwords
