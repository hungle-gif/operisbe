"""
Quick password reset script using direct database connection
Run this with: python quick_reset_passwords.py
"""
import sys
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

import hashlib
import base64
import os
import sqlite3
from pathlib import Path

def make_password(password, salt=None, iterations=600000):
    """
    Create Django-compatible PBKDF2 password hash
    """
    if salt is None:
        salt = base64.b64encode(os.urandom(16)).decode('utf-8')[:22]

    hash_obj = hashlib.pbkdf2_hmac('sha256', password.encode('utf-8'), salt.encode('utf-8'), iterations)
    hash_b64 = base64.b64encode(hash_obj).decode('utf-8').strip()

    return f'pbkdf2_sha256${iterations}${salt}${hash_b64}'

def reset_passwords():
    """Reset all user passwords in SQLite database"""

    # Find database file
    db_path = Path(__file__).parent / 'db.sqlite3'

    if not db_path.exists():
        print(f"[ERROR] Database not found at: {db_path}")
        print("   Make sure you're running this from the backend directory")
        return

    new_password = '123456789'
    password_hash = make_password(new_password)

    # Connect to database
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    # Get all users
    cursor.execute("SELECT id, email, role FROM users")
    users = cursor.fetchall()

    if not users:
        print("[ERROR] No users found in database")
        conn.close()
        return

    total = len(users)
    print(f"\n{'='*60}")
    print(f"Resetting passwords for {total} users...")
    print(f"{'='*60}\n")

    # Update each user
    updated = 0
    for user_id, email, role in users:
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (password_hash, user_id))
        updated += 1
        print(f"[OK] [{updated}/{total}] {email:<30} ({role:<10}) - Password reset")

    # Commit changes
    conn.commit()
    conn.close()

    print(f"\n{'='*60}")
    print(f"[SUCCESS] Reset passwords for {updated} users!")
    print(f"{'='*60}")
    print(f"\nAll accounts now use password: {new_password}\n")

    # Print by role
    conn = sqlite3.connect(str(db_path))
    cursor = conn.cursor()

    roles = ['admin', 'sale', 'dev', 'customer']
    for role in roles:
        cursor.execute("SELECT email FROM users WHERE role = ?", (role,))
        role_users = cursor.fetchall()
        if role_users:
            print(f"\n[{role.upper()}] accounts:")
            for (email,) in role_users:
                print(f"   Email: {email:<30} Password: {new_password}")

    conn.close()
    print(f"\n{'='*60}\n")

if __name__ == '__main__':
    try:
        reset_passwords()
    except Exception as e:
        print(f"[ERROR] Error: {e}")
        import traceback
        traceback.print_exc()
