import sys
import traceback

print("Verifying backend integrity...")

try:
    print("Importing auth...")
    import auth
    print("Importing main...")
    from main import app
    print("Backend integrity: OK")
except Exception as e:
    print("Backend integrity: FAILED")
    traceback.print_exc()
    sys.exit(1)
