import os
import unicodedata

DATA_STORE_DIR = r"c:\Project\AInote\backend\data_store"

print(f"Scanning: {DATA_STORE_DIR}")

for root, dirs, files in os.walk(DATA_STORE_DIR):
    print(f"\n📁 Directory: {root}")
    for f in files:
        nfc = unicodedata.normalize('NFC', f)
        print(f"  📄 {f} (NFC: {nfc})")
