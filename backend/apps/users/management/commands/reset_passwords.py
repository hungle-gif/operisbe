"""
Django management command to reset all user passwords
Usage: python manage.py reset_passwords
"""
from django.core.management.base import BaseCommand
from apps.users.models import User


class Command(BaseCommand):
    help = 'Reset all user passwords to 123456789'

    def handle(self, *args, **kwargs):
        new_password = '123456789'

        users = User.objects.all()
        total = users.count()

        self.stdout.write("\n" + "="*60)
        self.stdout.write(f"🔄 Resetting passwords for {total} users...")
        self.stdout.write("="*60 + "\n")

        updated = 0
        for user in users:
            user.set_password(new_password)
            user.save()
            updated += 1

            self.stdout.write(
                f"✅ [{updated}/{total}] {user.email:<30} ({user.role:<10}) - Password reset"
            )

        self.stdout.write("\n" + "="*60)
        self.stdout.write(f"✅ Successfully reset passwords for {updated} users!")
        self.stdout.write("="*60)
        self.stdout.write("\n📋 Login credentials:\n")

        # Print organized by role
        roles = ['admin', 'sale', 'dev', 'customer']
        for role in roles:
            role_users = User.objects.filter(role=role)
            if role_users.exists():
                self.stdout.write(f"\n🔹 {role.upper()} accounts:")
                for user in role_users:
                    self.stdout.write(f"   Email: {user.email:<30} Password: {new_password}")

        self.stdout.write("\n" + "="*60 + "\n")
