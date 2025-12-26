import sys
# FIX: Force add User Site-packages to path for Python 3.14
try:
    sys.path.append(r"C:\Users\NorNonE\AppData\Roaming\Python\Python314\site-packages")
except:
    pass

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.concurrency import run_in_threadpool
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import uvicorn
import os
import uuid
import json
import datetime
import requests

# Internal modules
import rag_engine
import audio_service
import llm_engine

# ==========================================
# 1. CONSTANTS & HELPER FUNCTIONS
# ==========================================

PERSONA_FILE = "persona.txt"
HISTORY_FILE = "training_history.json"
DATA_STORE_DIR = "data_store"
STATIC_AUDIO_DIR = "static_audio"

os.makedirs(DATA_STORE_DIR, exist_ok=True)
os.makedirs(STATIC_AUDIO_DIR, exist_ok=True)

def load_persona():
    if os.path.exists(PERSONA_FILE):
        with open(PERSONA_FILE, "r", encoding="utf-8") as f:
            return f.read().strip()
    return ""

def save_persona(text):
    with open(PERSONA_FILE, "w", encoding="utf-8") as f:
        f.write(text)

def load_history():
    if os.path.exists(HISTORY_FILE):
        with open(HISTORY_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def save_history(entry):
    history = load_history()
    history.append(entry)
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(history, f, ensure_ascii=False, indent=2)

def train_text_internal(title: str, text: str):
    # SAVE RAW TEXT TO DATA STORE (Sanitize filename)
    safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')])
    safe_filename = f"{safe_title.strip()}.txt"
    file_path = os.path.join(DATA_STORE_DIR, safe_filename)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

    # Add to RAG
    rag_engine.add_documents([text], metadatas=[{"source": safe_filename}])
    
    # Log to history
    entry = {
        "filename": safe_filename, 
        "original_title": title,
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "Success (Text)"
    }
    save_history(entry)
    
    return {"filename": safe_filename, "status": "Training completed"}

# ==========================================
# 2. APP SETUP & MODELS
# ==========================================

app = FastAPI(title="AI Personal Assistant API")

# Initialize LLM on startup
print("Initializing LLM Engine...")
llm = None
try:
    llm = llm_engine.get_engine()
    print("LLM Engine Initialized.")
except Exception as e:
    print(f"CRITICAL WARNING: LLM Engine failed to initialize: {e}")
    llm = None

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Audio
app.mount("/static/audio", StaticFiles(directory=STATIC_AUDIO_DIR), name="static_audio")

class ChatRequest(BaseModel):
    message: str
    persona: Optional[str] = None
    mute_audio: bool = False
    remote_llm_url: Optional[str] = None # Support for Colab Brain

class PersonaRequest(BaseModel):
    persona_text: str

class ForgetRequest(BaseModel):
    filename: str

class TrainTextRequest(BaseModel):
    title: str
    text: str

# Short-term Memory (Last 10 turns)
conversation_history = []

# ==========================================
# 3. ENDPOINTS
# ==========================================

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    global conversation_history
    print(f"[{datetime.datetime.now()}] Incoming Chat Request: {request.message[:20]}...")
    
    # 0. Check for Training Keywords (Robust Detection)
    msg = request.message.strip()
    clean_msg = msg.lstrip("-•*> ").lower()
    
    # Expanded keywords (Longer phrases first for greedy matching)
    keywords = [
        "จำไว้ว่า", "สอนว่า", "remember that", "teach that", "รู้ไหมว่า",
        "ช่วยจำใหม่หน่อย", "ช่วยจำใหม่", "ฝากจำใหม่",
        "ช่วยจำหน่อย", "ฝากจำหน่อย", "จดหน่อย", "จำหน่อยว่า", "จำหน่อย", "ช่วยจำว่า",
        "ช่วยจำ", "ฝากจำ", "จดไว้", "mem", "บันทึก"
    ]
    
    print(f"DEBUG: Processing message '{clean_msg}'")
    for kw in keywords:
        if clean_msg.startswith(kw):
             print(f"DEBUG: Keyword match '{kw}'")
             lower_msg = msg.lower()
             idx = lower_msg.find(kw)
             if idx != -1:
                content = msg[idx + len(kw):].strip()
                # Additional cleanup for politeness particles at start of content
                for particle in ["หน่อย", "นะ", "ด้วย", "ค่ะ", "ครับ"]:
                    if content.startswith(particle):
                        content = content[len(particle):].strip()

                if content:
                    print(f"DEBUG: Training Triggered with content '{content}'")
                    title = "Chat: " + content[:30] + "..."
                    train_text_internal(title, content)
                    
                    # Hack: Inject into Short-term memory so she "knows" she just remembered it (since RAG is disabled)
                    conversation_history.append(("User", request.message))
                    conversation_history.append(("System", f"[Memory Recorded: {content}]"))
                    
                    reply_text = f"รับทราบค่ะ! (* >ω<) มะลิจำได้แล้วว่า \"{content}\""
                    conversation_history.append(("Mali", reply_text))
                    
                    return {"reply": reply_text, "audio_url": None, "animation_state": "idle", "model_source": "System (Memory)"}
    
    print("DEBUG: No keyword match, proceeding to LLM...")

    # 1. Retrieve RAG Context
    rag_docs = rag_engine.query_memory(request.message, n_results=3) # Increase results to 3
    rag_text = "\n".join([doc.page_content for doc in rag_docs]) if rag_docs else ""
    print(f"DEBUG: RAG Retrieved:\n---\n{rag_text}\n---")
    
    # 2. Format Conversation History
    history_text = ""
    if conversation_history:
        # Filter out "System" roles if needed, or include them for context
        formatted_history = []
        # Restore context to 6 items (3 turns) for better recall
        for role, text in conversation_history[-6:]:
            if role == "System": # Treat system notes as context
                formatted_history.append(f"(Context: {text})")
            else:
                formatted_history.append(f"{role}: {text}")
        history_text = "\nประวัติการคุยล่าสุด:\n" + "\n".join(formatted_history)
    
    # Combine RAG + History into unified context
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    full_context = f"[Current Time: {current_time_str}]\n{rag_text}\n{history_text}"
    print(f"Context: RAG={len(rag_text)} chars, History={len(history_text)} chars")
    
    # 3. Determine Reply
    current_persona = request.persona or load_persona()
    if not current_persona: current_persona = "Mali-chan"

    # 4. Generate Reply (Remote or Local)
    ai_text_reply = ""
    
    if request.remote_llm_url and request.remote_llm_url.startswith("http"):
        # Proxy to Cloud Brain (Colab)
        try:
            print(f"Proxying to Cloud Brain: {request.remote_llm_url}")
            payload = {
                "message": request.message,
                "context": full_context,
                "persona": current_persona
            }
            resp = await run_in_threadpool(requests.post, f"{request.remote_llm_url}/chat", json=payload, timeout=60)
            if resp.status_code == 200:
                ai_text_reply = resp.json().get("reply", "")
                model_source = "Cloud Brain (ThaiLLM)"
            else:
                print(f"Remote Brain Error {resp.status_code}: {resp.text}")
                ai_text_reply = None # Force Fallback
        except Exception as e:
            print(f"Cloud Brain Failed (Connection Error): {e}")
            ai_text_reply = None # Force Fallback
    
    if not ai_text_reply:
         # Fallback to Local LLM
         print("Using Local Brain (Qwen)...")
         local_reply = await run_in_threadpool(
            llm.generate_reply,
            user_message=request.message,
            context_text=full_context,
            persona_text=current_persona
        )
         ai_text_reply = local_reply
         model_source = "Local Brain (Qwen)"
    
    if not ai_text_reply:
         ai_text_reply = f"{current_persona} ขอโทษค่ะ สมองหนูเบลอนิดหน่อย (LLM Error)"

    # 5. Generate Audio (TTS)
    audio_url = None
    if not request.mute_audio: 
        try:
             audio_filename = f"reply_{uuid.uuid4()}.mp3"
             audio_path = os.path.join(STATIC_AUDIO_DIR, audio_filename)
             await audio_service.generate_audio(ai_text_reply, audio_path)
             audio_url = f"/static/audio/{audio_filename}"
        except Exception as e:
             print(f"TTS Error: {e}")
    
    print(f"[{datetime.datetime.now()}] Reply Generated: {ai_text_reply[:20]}...")
    
    # Update Short-term Memory
    if ai_text_reply:
        conversation_history.append(("User", request.message))
        conversation_history.append(("Mali", ai_text_reply))
        if len(conversation_history) > 10:
            conversation_history = conversation_history[-10:]

    return {
        "reply": ai_text_reply,
        "audio_url": audio_url,
        "animation_state": "talking" if audio_url else "idle",
        "model_source": model_source
    }

@app.get("/persona")
async def get_persona_endpoint():
    return {"persona": load_persona()}

@app.post("/persona")
async def save_persona_endpoint(request: PersonaRequest):
    save_persona(request.persona_text)
    return {"status": "Persona updated", "persona": request.persona_text}

@app.get("/history")
async def get_history():
    return load_history()

@app.post("/forget")
async def forget_endpoint(request: ForgetRequest):
    file_path = os.path.join(DATA_STORE_DIR, request.filename)
    if os.path.exists(file_path):
        os.remove(file_path)

    history = load_history()
    new_history = [entry for entry in history if entry['filename'] != request.filename]
    
    with open(HISTORY_FILE, "w", encoding="utf-8") as f:
        json.dump(new_history, f, ensure_ascii=False, indent=2)

    rag_engine.rebuild_index(DATA_STORE_DIR)
    
    return {"status": "Forgotten", "filename": request.filename}

@app.get("/download/{filename}")
async def download_file(filename: str):
    from fastapi.responses import FileResponse # Import locally or top level
    file_path = os.path.join(DATA_STORE_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")

@app.post("/train")
async def train_endpoint(file: UploadFile = File(...)):
    content = await file.read()
    text = content.decode("utf-8")
    
    file_path = os.path.join(DATA_STORE_DIR, file.filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

    rag_engine.add_documents([text], metadatas=[{"source": file.filename}])
    
    entry = {
        "filename": file.filename,
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "Success (File)"
    }
    save_history(entry)
    
    return {"filename": file.filename, "status": "Training completed"}

@app.post("/train-text")
async def train_text_endpoint(request: TrainTextRequest):
    return train_text_internal(request.title, request.text)

@app.post("/voice-chat")
async def voice_chat_endpoint(file: UploadFile = File(...)):
    temp_filename = f"temp_{uuid.uuid4()}.wav"
    with open(temp_filename, "wb") as buffer:
        buffer.write(await file.read())
        
    text = audio_service.transcribe_audio(temp_filename)
    
    if os.path.exists(temp_filename):
        os.remove(temp_filename)
    
    if not text:
        return {"reply": "Sorry, I could not hear you.", "audio_url": None, "animation_state": "idle"}
    
    chat_req = ChatRequest(message=text)
    response = await chat_endpoint(chat_req)
    
    return {
        "transcription": text,
        "reply": response["reply"],
        "audio_url": response["audio_url"],
        "animation_state": "talking"
    }

# ==========================================
# 4. MAIN ENTRY POINT
# ==========================================

if __name__ == "__main__":
    # Run in single process mode to ensure sys.path works and no multiprocessing issues
    print("Starting Uvicorn Server on Port 8000...")
    try:
        uvicorn.run(app, host="0.0.0.0", port=8000, reload=False)
    except Exception as e:
        print(f"Server Crash: {e}")
