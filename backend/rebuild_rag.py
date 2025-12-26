import rag_engine
import os

print("Rebuilding index...")
if os.path.exists("data_store"):
    rag_engine.rebuild_index("data_store")
    print("Rebuild complete.")
else:
    print("data_store not found.")
