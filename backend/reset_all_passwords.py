"""
Script to reset all user passwords to 123456789
Run this with: python manage.py shell < reset_all_passwords.py
"""
import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User

def reset_all_passwords():
    """Reset all user passwords to 123456789"""
    new_password = '123456789'

    users = User.objects.all()
    total = users.count()

    print(f"\n{'='*60}")
    print(f"🔄 Resetting passwords for {total} users...")
    print(f"{'='*60}\n")

    updated = 0
    for user in users:
        old_email = user.email
        user.set_password(new_password)
        user.save()
        updated += 1

        print(f"✅ [{updated}/{total}] {user.email:<30} ({user.role:<10}) - Password reset")

    print(f"\n{'='*60}")
    print(f"✅ Successfully reset passwords for {updated} users!")
    print(f"{'='*60}")
    print(f"\n📋 Login credentials:\n")

    # Print organized by role
    roles = ['admin', 'sale', 'dev', 'customer']
    for role in roles:
        role_users = User.objects.filter(role=role)
        if role_users.exists():
            print(f"\n🔹 {role.upper()} accounts:")
            for user in role_users:
                print(f"   Email: {user.email:<30} Password: {new_password}")

    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    reset_all_passwords()
