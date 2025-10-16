import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.development')
django.setup()

from apps.users.models import User, UserRole

# Create demo users
demo_users = [
    {
        'email': 'admin@operis.com',
        'password': 'admin123',
        'full_name': 'Admin User',
        'role': UserRole.ADMIN,
        'is_staff': True,
        'is_superuser': True,
    },
    {
        'email': 'sale@operis.com',
        'password': 'sale123',
        'full_name': 'Sale User',
        'role': UserRole.SALE,
    },
    {
        'email': 'dev@operis.com',
        'password': 'dev123',
        'full_name': 'Developer User',
        'role': UserRole.DEV,
    },
    {
        'email': 'customer@operis.com',
        'password': 'customer123',
        'full_name': 'Customer User',
        'role': UserRole.CUSTOMER,
    },
]

for user_data in demo_users:
    if not User.objects.filter(email=user_data['email']).exists():
        User.objects.create_user(**user_data)
        print(f"✅ Created user: {user_data['email']} (password: {user_data['password']})")
    else:
        print(f"⏭️  User already exists: {user_data['email']}")

print("\n🎉 Demo users created successfully!")
print("\n📝 Login credentials:")
print("   Admin:    admin@operis.com    / admin123")
print("   Sale:     sale@operis.com     / sale123")
print("   Dev:      dev@operis.com      / dev123")
print("   Customer: customer@operis.com / customer123")
