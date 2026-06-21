import os
import unicodedata

DATA_STORE_DIR = r"c:\Project\AInote\backend\data_store"
target_filename = "ประชุม.txt"
target_nfc = unicodedata.normalize('NFC', target_filename)

print(f"Target (NFC): {target_nfc!r}")
print(f"Hex: {target_nfc.encode('utf-8').hex()}")

print("Traversal:")
found = False
for root, dirs, files in os.walk(DATA_STORE_DIR):
    for f in files:
        f_nfc = unicodedata.normalize('NFC', f)
        if "ประชุม" in f:
            print(f"Found candidate: {f!r}")
            print(f"  Root: {root}")
            print(f"  NFC: {f_nfc!r}")
            print(f"  Hex: {f_nfc.encode('utf-8').hex()}")
            
            if f_nfc == target_nfc:
                print("  MATCHED!")
                found = True
            else:
                print("  NO MATCH")

if not found:
    print("FAILED TO FIND FILE")
