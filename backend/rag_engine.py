from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import SentenceTransformerEmbeddings
import os

# Initialize Embeddings
# Use simple sentence-transformers for embeddings (runs locally)
print("Initializing Embedding Model (RAG Memory)...")
embeddings = None
try:
    # Attempt to load robustly
    from langchain_community.embeddings import SentenceTransformerEmbeddings
    embeddings = SentenceTransformerEmbeddings(model_name="all-MiniLM-L6-v2")
    print("Alignment Chip Online: RAG Memory Active ✅")
except Exception as e:
    print(f"CRITICAL: Memory System Failed to Load: {e}")
    print("Running in Amnesia Mode (Short-term memory only) ⚠️")
    embeddings = None

# Global variable to hold the vector store
vector_store = None
DB_PATH = "faiss_index"

def get_vector_store():
    global vector_store
    if vector_store:
        return vector_store
    
    if os.path.exists(DB_PATH):
        try:
            vector_store = FAISS.load_local(DB_PATH, embeddings, allow_dangerous_deserialization=True)
            return vector_store
        except Exception as e:
            print(f"Failed to load existing index: {e}")
            pass
    
    # Initialize empty if needed or handle first creation
    # FAISS usually requires texts to initialize. 
    # We'll initialize it lazily when first document is added or generic init
    return None


def add_documents(documents: list[str], metadatas: list[dict] = None):
    global vector_store
    if not documents:
        return

    # SAFEGUARD: If embeddings not loaded, skip RAG
    if embeddings is None:
        print("⚠️ RAG Disabled: Skipping memory addition.")
        return
        
    if vector_store is None:
        try:
            vector_store = FAISS.from_texts(documents, embeddings, metadatas=metadatas)
        except Exception as e:
            print(f"RAG Error (Init): {e}")
            return
    else:
        try:
            vector_store.add_texts(documents, metadatas=metadatas)
        except Exception as e:
            print(f"RAG Error (Add): {e}")
            return
    
    try:
        vector_store.save_local(DB_PATH)
    except Exception as e:
        print(f"RAG Error (Save): {e}")

def query_memory(query_text: str, n_results=3):
    global vector_store
    
    if embeddings is None:
        return []

    # Refresh in case it was loaded or created
    if vector_store is None:
        vector_store = get_vector_store()
    
    if vector_store is None:
        return []
        
    try:
        results = vector_store.similarity_search(query_text, k=n_results)
        return results
    except Exception as e:
        print(f"RAG Query Error: {e}")
        return []

def clear_memory():
    global vector_store
    if os.path.exists(DB_PATH):
        import shutil
        shutil.rmtree(DB_PATH, ignore_errors=True)
    vector_store = None

def rebuild_index(data_store_path: str):
    """
    Rebuilds the FAISS index from scratch using all files in data_store_path.
    1. Clear existing memory.
    2. Read all files.
    3. Re-add documenst.
    """
    global vector_store
    
    if embeddings is None:
        print("⚠️ RAG Disabled: Skipping rebuild.")
        return

    print("🧹 Clearing memory for rebuild...")
    clear_memory()
    
    if not os.path.exists(data_store_path):
        print("⚠️ No data store found, index cleared.")
        return

    documents = []
    metadatas = []

    print("📂 Scanning data store...")
    for filename in os.listdir(data_store_path):
        file_path = os.path.join(data_store_path, filename)
        if os.path.isfile(file_path):
             try:
                with open(file_path, "r", encoding="utf-8") as f:
                    text = f.read()
                    documents.append(text)
                    metadatas.append({"source": filename})
             except Exception as e:
                 print(f"❌ Failed to read {filename}: {e}")
    
    if documents:
        print(f"🧠 Re-learning {len(documents)} items...")
        add_documents(documents, metadatas=metadatas)
        print("✅ Rebuild complete.")
    else:
        print("⚠️ No documents to learn.")
