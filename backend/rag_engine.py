from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import SentenceTransformerEmbeddings
import os
import shutil

# Initialize Embeddings
print("Initializing Embedding Model (RAG Memory)...")
embeddings = None
try:
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    print("Alignment Chip Online: RAG Memory Active ✅")
except Exception as e:
    print(f"CRITICAL: Memory System Failed to Load: {e}")
    print("Running in Amnesia Mode (Short-term memory only) ⚠️")
    embeddings = None

MEMORY_DIR = "memory_indices"
GLOBAL_INDEX = "global"

def get_index_path(user_id=None):
    if user_id is None:
        return os.path.join(MEMORY_DIR, GLOBAL_INDEX)
    return os.path.join(MEMORY_DIR, f"user_{user_id}")

def get_vector_store(user_id=None):
    path = get_index_path(user_id)
    if os.path.exists(path):
        try:
            return FAISS.load_local(path, embeddings, allow_dangerous_deserialization=True)
        except Exception as e:
            print(f"Failed to load index for {user_id}: {e}")
            return None
    return None

def add_documents(documents: list[str], metadatas: list[dict] = None, user_id: int = None):
    """
    Add documents to specific memory index (Global or User).
    """
    if not documents or embeddings is None:
        return

    path = get_index_path(user_id)
    vector_store = get_vector_store(user_id)

    if vector_store is None:
        try:
            vector_store = FAISS.from_texts(documents, embeddings, metadatas=metadatas)
        except Exception as e:
            print(f"RAG Init Error: {e}")
            return
    else:
        try:
            vector_store.add_texts(documents, metadatas=metadatas)
        except Exception as e:
            print(f"RAG Add Error: {e}")
            return
    
    # Save
    os.makedirs(path, exist_ok=True)
    vector_store.save_local(path)

def query_memory(query_text: str, n_results=3, user_id: int = None):
    """
    Query both Global and Private memory.
    """
    if embeddings is None:
        return []

    results = []
    
    # 1. Query Global
    global_store = get_vector_store(None)
    if global_store:
        try:
            results.extend(global_store.similarity_search(query_text, k=n_results))
        except Exception: 
            pass

    # 2. Query Private (if User)
    if user_id:
        user_store = get_vector_store(user_id)
        if user_store:
            try:
                results.extend(user_store.similarity_search(query_text, k=n_results))
            except Exception:
                pass
    
    # Deduplicate (by content potentially) and maybe re-rank?
    # For now, simplistic combination: just take them all.
    # Optionally limit to n_results * 2
    return results[:n_results*2] # Return broad context

def clear_memory(user_id=None):
    path = get_index_path(user_id)
    if os.path.exists(path):
        shutil.rmtree(path, ignore_errors=True)

def rebuild_index(data_store_path: str):
    # This legacy rebuild function was for the single index.
    # We might need to deprecate or update it to scan the new separated folders.
    # For now, let's keep it simple: It clears GLOBAL memory.
    print("⚠️ Rebuild Index called - Clearing GLOBAL memory only.")
    clear_memory(None)
    # Re-implmentation logic would need to know which file belongs to whom.
    # We will defer this logic to the new `train_text_internal` flow.
    pass

