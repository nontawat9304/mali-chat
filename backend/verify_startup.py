import sys
sys.path.append(r"C:\Users\NorNonE\AppData\Roaming\Python\Python314\site-packages")

try:
    print("1. Importing fastapi...")
    import fastapi
    print("   Success")
except Exception as e:
    print(f"FAILED fastapi: {e}")

try:
    print("2. Importing uvicorn...")
    import uvicorn
    print("   Success")
except Exception as e:
    print(f"FAILED uvicorn: {e}")

try:
    print("3. Importing rag_engine...")
    import rag_engine
    print("   Success")
except Exception as e:
    print(f"FAILED rag_engine: {e}")

try:
    print("4. Importing audio_service...")
    import audio_service
    print("   Success")
except Exception as e:
    print(f"FAILED audio_service: {e}")

try:
    print("5. Importing llm_engine...")
    import llm_engine
    print("   Success")
except Exception as e:
    print(f"FAILED llm_engine: {e}")

try:
    print("6. Importing main...")
    import main
    print("   Success")
except Exception as e:
    print(f"FAILED main: {e}")
