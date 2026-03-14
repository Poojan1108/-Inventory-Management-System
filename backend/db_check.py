import os
import sys
import django
from django.conf import settings
from django.db import connection
from django.db.migrations.executor import MigrationExecutor
from django.core.management import call_command
import importlib.util

def check_package(package_name):
    spec = importlib.util.find_spec(package_name)
    return spec is not None

def main():
    print("=== Inventory Management System Project Diagnostic ===")
    
    # 1. Setup Django Environment
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
    try:
        django.setup()
        print("[OK] Django Environment Setup")
    except Exception as e:
        print(f"[FAIL] Django Environment Setup: {e}")
        return

    # 2. Package Validation
    print("\n--- Environment Validation ---")
    packages = ['django', 'psycopg2', 'rest_framework', 'corsheaders']
    for pkg in packages:
        status = "OK" if check_package(pkg) else "MISSING"
        print(f"[{status}] {pkg}")

    # 3. DB Connectivity Test
    print("\n--- Database Connectivity ---")
    try:
        connection.ensure_connection()
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            row = cursor.fetchone()
            if row:
                print(f"[OK] Database connected to: {settings.DATABASES['default']['NAME']}")
    except Exception as e:
        print(f"[FAIL] Database Connection Error: {e}")

    # 4. Schema Migration Check
    print("\n--- Migration Status ---")
    try:
        executor = MigrationExecutor(connection)
        plan = executor.migration_plan(executor.loader.graph.leaf_nodes())
        if plan:
            print(f"[WARNING] Pending migrations detected ({len(plan)} migrations).")
            print("Run 'python manage.py migrate' to apply them.")
        else:
            print("[OK] All migrations are up to date.")
    except Exception as e:
        print(f"[ERROR] Could not check migrations: {e}")

    # 5. Project Structure & Folders
    print("\n--- Project Structure ---")
    
    # Static
    static_root = getattr(settings, 'STATIC_ROOT', None)
    static_url = getattr(settings, 'STATIC_URL', None)
    print(f"STATIC_URL: {static_url}")
    if static_root:
        print(f"STATIC_ROOT: {static_root}")
        if os.path.exists(static_root):
            print(f"[OK] Static directory exists.")
        else:
            print(f"[FAIL] Static directory missing at {static_root}")
    else:
        print("[WARNING] STATIC_ROOT is not configured in settings.py")

    # Media
    media_root = getattr(settings, 'MEDIA_ROOT', None)
    media_url = getattr(settings, 'MEDIA_URL', None)
    print(f"MEDIA_URL: {media_url}")
    if media_root:
        print(f"MEDIA_ROOT: {media_root}")
        if os.path.exists(media_root):
            print(f"[OK] Media directory exists.")
        else:
            print(f"[FAIL] Media directory missing at {media_root}")
    else:
        print("[WARNING] MEDIA_ROOT is not configured in settings.py")

    print("\n=== Diagnostic Complete ===")

if __name__ == "__main__":
    main()
