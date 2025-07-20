#!/usr/bin/env python3
"""
Create a test user for DeerFlow authentication testing
"""

import sqlite3
import os
from passlib.context import CryptContext
from datetime import datetime

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_test_user():
    """Create a test user in the local database."""
    
    # Database path
    db_path = "deerflow.db"
    
    if not os.path.exists(db_path):
        print("❌ Database file not found. Make sure the server has been started at least once.")
        return False
    
    # Test user credentials
    email = "test@example.com"
    username = "testuser"
    password = "test123"
    hashed_password = pwd_context.hash(password)
    
    try:
        # Connect to database
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        # Check if user already exists
        cursor.execute("SELECT id FROM users WHERE email = ? OR username = ?", (email, username))
        existing = cursor.fetchone()
        
        if existing:
            print(f"✅ Test user already exists!")
            print(f"   Email: {email}")
            print(f"   Username: {username}")
            print(f"   Password: {password}")
        else:
            # Create test user
            cursor.execute("""
                INSERT INTO users (email, username, hashed_password, is_active, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                email,
                username, 
                hashed_password,
                True,
                datetime.utcnow().isoformat(),
                datetime.utcnow().isoformat()
            ))
            
            conn.commit()
            print(f"✅ Test user created successfully!")
            print(f"   Email: {email}")
            print(f"   Username: {username}")
            print(f"   Password: {password}")
        
        # Show all users
        cursor.execute("SELECT id, email, username, is_active FROM users")
        users = cursor.fetchall()
        
        print(f"\n📊 Current users in database:")
        for user in users:
            print(f"   ID: {user[0]}, Email: {user[1]}, Username: {user[2]}, Active: {user[3]}")
        
        conn.close()
        return True
        
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        return False

if __name__ == "__main__":
    print("🚀 Creating test user for DeerFlow")
    print("=" * 40)
    
    if create_test_user():
        print("\n🎉 Ready to test!")
        print("\n📋 Login credentials:")
        print("   Email/Username: test@example.com or testuser")
        print("   Password: test123")
        print("\n🌐 Go to: http://localhost:4000")
        print("   Click login and use the credentials above")
    else:
        print("\n❌ Failed to create test user")