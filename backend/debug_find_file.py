import os
import unicodedata

DATA_STORE_DIR = "data_store"
TARGET_FILENAME = "ประชุม.txt"

print(f"Checking in: {os.path.abspath(DATA_STORE_DIR)}")
print(f"Looking for: {TARGET_FILENAME} (NFC: {unicodedata.normalize('NFC', TARGET_FILENAME)})")

target_nfc = unicodedata.normalize('NFC', TARGET_FILENAME)

found = False
for root, dirs, files in os.walk(DATA_STORE_DIR):
    print(f"\nScanning: {root}")
    for f in files:
        f_nfc = unicodedata.normalize('NFC', f)
        print(f" - Found: {f} | NFC: {f_nfc} | Match? {f_nfc == target_nfc}")
        
        if f_nfc == target_nfc:
            print(f"   >>> MATCH FOUND! at {os.path.join(root, f)}")
            print(f"   >>> Content check...")
            try:
                with open(os.path.join(root, f), "r", encoding="utf-8") as file:
                    content = file.read()
                    print(f"   >>> Read Success! Length: {len(content)}")
            except Exception as e:
                print(f"   >>> READ FAILED: {e}")
            found = True

if not found:
    print("\nXXX FILE NOT FOUND by scan XXX")
