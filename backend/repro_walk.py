import os
import unicodedata

# EXACT PATH FROM SERVER.PY
DATA_STORE_DIR = r"c:\Project\AInote\backend\data_store"
FILENAME = "5543.txt"

print(f"--- REPRODUCING SCAN LOGIC ---")
print(f"Target: {DATA_STORE_DIR}")
print(f"Looking for: {FILENAME}")

filename_nfc = unicodedata.normalize('NFC', FILENAME)
found = False

for root, dirs, files in os.walk(DATA_STORE_DIR):
    print(f"Scanning Directory: {root}")
    # Normalize files on disk
    files_normalized = {unicodedata.normalize('NFC', f): f for f in files}
    
    if filename_nfc in files_normalized:
        real_filename = files_normalized[filename_nfc]
        print(f"✅ FOUND MATCH: {real_filename} in {root}")
        found = True
    else:
        print(f"   Files here: {list(files_normalized.keys())}")

if not found:
    print("❌ FILE NOT FOUND IN SCAN")
