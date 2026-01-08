import sys
import os

# Ensure we can import from current directory
sys.path.append(os.getcwd())

try:
    from main import app
    print("✅ Successfully imported 'app' from main.py")
    
    print("\n--- REGISTERED ROUTES ---")
    for route in app.routes:
        if hasattr(route, "path"):
            print(f"Path: {route.path} | Name: {route.name}")
            
    print("\n-------------------------")
    
    # Check specifically for our target routes
    paths = [r.path for r in app.routes if hasattr(r, "path")]
    if "/train/content_v2" in paths:
        print("FOUND: /train/content_v2 is registered!")
    else:
        print("MISSING: /train/content_v2 is NOT in the route list.")

except ImportError as e:
    print(f"❌ ImportError: {e}")
except Exception as e:
    print(f"❌ Error: {e}")
