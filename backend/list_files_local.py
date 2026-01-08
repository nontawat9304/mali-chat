import os

DATA_STORE = r"c:\Project\AInote\backend\data_store"

print(f"Checking directory: {DATA_STORE}")
if os.path.exists(DATA_STORE):
    print("✅ Directory exists.")
    files = os.listdir(DATA_STORE)
    print(f"Found {len(files)} files:")
    for f in files:
        print(f" - {f}")
else:
    print("❌ Directory NOT FOUND.")
