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
import traceback

# Internal modules
import rag_engine
import audio_service
import llm_engine
import models, database, auth
from sqlalchemy.orm import Session
from fastapi import Depends, status
from fastapi.security import OAuth2PasswordRequestForm

# Initialize Database Models
models.Base.metadata.create_all(bind=database.engine)

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

def train_text_internal(title: str, text: str, user_id: int = None):
    # Determine Scope
    scope_dir = "global" if user_id is None else f"users/{user_id}"
    full_store_dir = os.path.join(DATA_STORE_DIR, scope_dir)
    os.makedirs(full_store_dir, exist_ok=True)
    
    # SAVE RAW TEXT TO DATA STORE (Sanitize filename)
    safe_title = "".join([c for c in title if c.isalnum() or c in (' ', '-', '_')])
    safe_filename = f"{safe_title.strip()}.txt"
    file_path = os.path.join(full_store_dir, safe_filename)
    
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

    # Add to RAG (Shared or Private) - with TIMESTAMP for context awareness
    current_date = datetime.datetime.now().strftime("%Y-%m-%d")
    rag_engine.add_documents([text], metadatas=[{"source": safe_filename, "memory_date": current_date}], user_id=user_id)
    
    # Log to history
    entry = {
        "filename": safe_filename, 
        "original_title": title,
        "timestamp": datetime.datetime.now().isoformat(),
        "status": "Success (Text)",
        "user_id": user_id,
        "scope": "Global" if user_id is None else "Private"
    }
    save_history(entry)
    
    return {"filename": safe_filename, "status": "Training completed", "scope": entry["scope"]}

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
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
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
    scope: str = "private" # 'private' or 'global'

# Short-term Memory (Last 10 turns)
conversation_history = []

# ==========================================
# 3. ENDPOINTS
# ==========================================

class UserRegister(BaseModel):
    email: str
    password: str
    nickname: str

from fastapi.responses import JSONResponse

@app.post("/auth/register")
async def register(user: UserRegister, db: Session = Depends(database.get_db)):
    try:
        # Check if email exists
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            raise HTTPException(status_code=400, detail="Email already registered")
        
        # First user is admin
        is_first_user = db.query(models.User).count() == 0
        role = "admin" if is_first_user else "user"
        
        hashed_password = auth.get_password_hash(user.password)
        new_user = models.User(
            email=user.email,
            nickname=user.nickname,
            hashed_password=hashed_password,
            role=role,
            is_active=True
        )
        db.add(new_user)
        db.commit()
        return {"msg": "User created", "role": role}
    except Exception as e:
        print(f"REGISTER ERROR: {e}")
        import traceback
        traceback.print_exc()
        return JSONResponse(status_code=500, content={"detail": f"Internal Error: {str(e)}"})

@app.post("/auth/login")
async def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    try:
        # NOTE: OAuth2PasswordRequestForm always has a 'username' field. We use it for 'email'.
        print(f"LOGIN ATTEMPT: {form_data.username}")
        user = db.query(models.User).filter(models.User.email == form_data.username).first()
        if not user or not auth.verify_password(form_data.password, user.hashed_password):
            print("Login failed: Invalid credentials")
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        if not user.is_active:
            print("Login failed: User banned")
            raise HTTPException(status_code=400, detail="User is banned")
        
        access_token = auth.create_access_token(data={"sub": user.email, "role": user.role}) # Use email as sub
        return {"access_token": access_token, "token_type": "bearer", "role": user.role, "nickname": user.nickname}
    except Exception as e:
        print(f"LOGIN ERROR: {e}")
        import traceback
        traceback.print_exc()
        raise e


@app.get("/auth/me")
async def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return {"email": current_user.email, "nickname": current_user.nickname, "role": current_user.role}

# --- ADMIN ENDPOINTS ---
@app.get("/admin/users")
async def get_all_users(db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    users = db.query(models.User).all()
    return [{"id": u.id, "email": u.email, "nickname": u.nickname, "role": u.role, "is_active": u.is_active} for u in users]


class UserUpdateRequest(BaseModel):
    is_active: Optional[bool] = None
    role: Optional[str] = None

@app.put("/admin/users/{user_id}")
async def update_user_status(user_id: int, request: UserUpdateRequest, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # PROTECT SUPER ADMIN (ID 1)
    if user.id == 1:
         raise HTTPException(status_code=403, detail="Cannot modify Super Admin (God Mode)")

    # Prevent modifying yourself
    if user.id == admin.id:
         raise HTTPException(status_code=400, detail="Cannot modify your own status")
         
    if request.is_active is not None:
        user.is_active = request.is_active
    
    if request.role is not None:
        user.role = request.role

    db.commit()
    return {"status": "User updated", "role": user.role, "is_active": user.is_active}

@app.delete("/admin/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(database.get_db), admin: models.User = Depends(auth.get_current_admin)):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
         raise HTTPException(status_code=404, detail="User not found")
    if user.id == admin.id:
         raise HTTPException(status_code=400, detail="Cannot delete yourself")
         
    db.delete(user)
    db.commit()
    return {"status": "User deleted"}


@app.post("/chat")
async def chat_endpoint(request: ChatRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(database.get_db)):
    print(f"[{datetime.datetime.now()}] Incoming Chat Request from {current_user.email}: {request.message[:20]}...")
    
    # 0. Check for Training Keywords (Robust Detection)
    msg = request.message.strip()
    clean_msg = msg.lstrip("-•*> ").lower()
    
    # Expanded keywords (Longer phrases first for greedy matching)
    keywords = [
        "จำไว้ว่า", "สอนว่า", "remember that", "teach that",
        "ช่วยจำใหม่หน่อย", "ช่วยจำใหม่", "ฝากจำใหม่",
        "ช่วยจำหน่อย", "ฝากจำหน่อย", "จดหน่อย", "จำหน่อยว่า", "จำหน่อย", "ช่วยจำว่า",
        "ช่วยจำ", "ฝากจำ", "จดไว้", "mem", "บันทึก"
    ]
    
    # --- AUTO-UPDATE NICKNAME INTENT ---
    # Detects: "เรียกผมว่านายท่าน", "เปลี่ยนชื่อฉันเป็นพี่หมู"
    nickname_keywords = ["เรียกผมว่า", "เรียกฉันว่า", "เรียกหนูว่า", "เปลี่ยนชื่อเป็น", "call me"]
    for nk in nickname_keywords:
        if nk in clean_msg:
             # Extract name
             try:
                 parts = msg.split(nk)
                 if len(parts) > 1:
                     new_name = parts[1].strip().split(" ")[0] # Get first word after keyword
                     # Cleanup particles
                     for p in ["หน่อย", "นะ", "สิ", "ค่ะ", "ครับ"]:
                         new_name = new_name.replace(p, "")
                     new_name = new_name.strip()
                     
                     if len(new_name) > 1:
                         print(f"Detected Name Change Intent: '{new_name}'")
                         current_user.nickname = new_name
                         db.commit() # Save to DB PERMANENTLY
                         
                         return {
                             "reply": f"รับทราบค่ะ! (* >ω<) ต่อไปนี้หนูจะเรียกว่า \"{new_name}\" นะคะ! (บันทึกข้อมูลถาวรแล้ว)", 
                             "audio_url": None, 
                             "animation_state": "happy", 
                             "model_source": "System (Profile Update)"
                         }
             except Exception as e:
                 print(f"Name change error: {e}")
    # -----------------------------------
    
    # ... (Keyword detection logic unchanged largely, but we won't inject into DB here for simplicity, or we treat it as System message)
    # Actually, let's keep the logic but remove the manual history append for the memory hack, 
    # instead we can just return.
    
    for kw in keywords:
        if clean_msg.startswith(kw):
             lower_msg = msg.lower()
             idx = lower_msg.find(kw)
             if idx != -1:
                content = msg[idx + len(kw):].strip()
                for particle in ["หน่อย", "นะ", "ด้วย", "ค่ะ", "ครับ"]:
                    if content.startswith(particle):
                        content = content[len(particle):].strip()

                if content:
                    title = "Chat: " + content[:30] + "..."
                    # Default "Remember this" via chat to PRIVATE memory
                    train_text_internal(title, content, user_id=current_user.id)
                    
                    # Save interaction
                    db.add(models.ChatMessage(user_id=current_user.id, role="user", content=request.message))
                    db.add(models.ChatMessage(user_id=current_user.id, role="system", content=f"[Memory Recorded (Private): {content}]"))
                    reply_text = f"รับทราบค่ะ! (* >ω<) มะลิจำได้แล้วว่า \"{content}\" (เฉพาะคุณเท่านั้น)"
                    db.add(models.ChatMessage(user_id=current_user.id, role="ai", content=reply_text))
                    db.commit()
                    
                    return {"reply": reply_text, "audio_url": None, "animation_state": "idle", "model_source": "System (Memory)"}
    
    # 1. Retrieve RAG Context (Global + Private)
    # Increase k to 10 to catch more relevant memories
    rag_docs = rag_engine.query_memory(request.message, n_results=10, user_id=current_user.id)
    # Label RAG content clearly so the model knows it overrides defaults
    rag_context_list = []
    for doc in rag_docs:
        date_str = doc.metadata.get("memory_date", "")
        prefix = f"[Memory {date_str}]: " if date_str else "[Memory]: "
        rag_context_list.append(f"{prefix}{doc.page_content}")
    
    rag_text = "\n".join(rag_context_list) if rag_context_list else ""
    
    # 2. Retrieve Conversation History from DB (Per User)
    # Get last 6 messages
    history_records = db.query(models.ChatMessage).filter(
        models.ChatMessage.user_id == current_user.id
    ).order_by(models.ChatMessage.timestamp.desc()).limit(6).all()
    
    # Reverse to chronological order
    history_records.reverse()
    
    formatted_history = []
    for record in history_records:
        if record.role == "system":
            formatted_history.append(f"(Context: {record.content})")
        elif record.role == "user":
            formatted_history.append(f"User: {record.content}")
        else: # ai
            formatted_history.append(f"Mali: {record.content}")
            
    history_text = "\nประวัติการคุยล่าสุด:\n" + "\n".join(formatted_history) if formatted_history else ""
    
    # Combine RAG + History
    current_time_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    full_context = f"[Current Time: {current_time_str}]\n[ข้อมูลผู้ใช้งาน]: ชื่อเล่นในระบบคือ \"{current_user.nickname}\" (ใช้เป็นค่าเริ่มต้น แต่หากมีคำสั่งเปลี่ยนชื่อ ให้ยึดตามคำสั่งล่าสุด)\n{rag_text}\n{history_text}"
    
    # 3. Determine Reply
    # FIX: Prioritize file-based persona for Hot-Reload capability
    file_persona = load_persona()
    current_persona = file_persona if file_persona else request.persona
    if not current_persona: current_persona = "Mali-chan"

    # 4. Generate Reply
    ai_text_reply = ""
    current_provider = getattr(llm, 'provider', 'local')
    if current_provider == 'gemini':
        model_source = "Cloud Brain (Gemini)"
    elif current_provider == 'colab':
        model_source = "Cloud Brain (Colab GPU)"
    elif current_provider == 'lmstudio':
        model_source = "Local Brain (LM Studio)"
    else:
        model_source = "Local Brain (Qwen/CPU)"
    
    # REMOVED LEGACY PROXY BLOCK causing 404
    # All remote logic is now handled by llm_engine via .env configuration
    pass
    
    if not ai_text_reply:
         local_reply = await run_in_threadpool(
            llm.generate_reply,
            user_message=request.message,
            context_text=full_context,
            persona_text=current_persona
        )
         ai_text_reply = local_reply
    
    if not ai_text_reply:
         # Fix: Don't print current_persona (it's the whole file!)
         ai_text_reply = "หนูมะลิ (System): ขอโทษค่ะ สมองหนูเบลอนิดหน่อย (Remote AI Error) ลองเช็ค Colab ดูหน่อยนะค้า"
    
    # --- POST-PROCESSING FORCE REPLACEMENT ---
    # Safe Replacement Strategy:
    # 1. Replace "ฉัน" at the start of the message
    # 2. Replace " ฉัน " (surrounded by spaces)
    # 3. Replace "ดิฉัน" (always safe to replace for this character)
    # This avoids breaking words inside sentences like "อ่านว่าฉัน" (Read as Chan)
    
    if ai_text_reply:
        # Clear "Chan" at start
        if ai_text_reply.startswith("ฉัน"):
            ai_text_reply = "หนู" + ai_text_reply[3:]
        
        # Clear "Chan" with spaces
        ai_text_reply = ai_text_reply.replace(" ฉัน ", " หนู ")
        
        # Always kill "Di-Chan" (formal I)
        ai_text_reply = ai_text_reply.replace("ดิฉัน", "หนู")
        
        # Common particles
        ai_text_reply = ai_text_reply.replace("คะ", "ค่า").replace("ค่ะ", "ค่า") # Make it cuter

    # 5. Generate Audio
    audio_url = None
    if not request.mute_audio: 
        try:
             audio_filename = f"reply_{uuid.uuid4()}.mp3"
             audio_path = os.path.join(STATIC_AUDIO_DIR, audio_filename)
             await audio_service.generate_audio(ai_text_reply, audio_path)
             audio_url = f"/static/audio/{audio_filename}"
        except Exception as e:
             print(f"TTS Error: {e}")
    
    # Save Transaction to DB
    db.add(models.ChatMessage(user_id=current_user.id, role="user", content=request.message))
    db.add(models.ChatMessage(user_id=current_user.id, role="ai", content=ai_text_reply))
    db.commit()

    return {
        "reply": ai_text_reply,
        "audio_url": audio_url,
        "animation_state": "talking" if audio_url else "idle",
        "model_source": model_source
    }

@app.get("/persona")
async def get_persona_endpoint(admin: models.User = Depends(auth.get_current_admin)):
    return {"persona": load_persona()}

@app.post("/persona")
async def save_persona_endpoint(request: PersonaRequest, admin: models.User = Depends(auth.get_current_admin)):
    save_persona(request.persona_text)
    return {"status": "Persona updated", "persona": request.persona_text}

@app.get("/history")
async def get_history(current_user: models.User = Depends(auth.get_current_user)):
    all_history = load_history()
    
    # helper for safety (handle missing user_id in old legacy records)
    def is_visible(entry):
        # Admin sees everything
        if current_user.role == 'admin':
            return True
        
        # User sees: Their own files OR Global files
        owner_id = entry.get('user_id')
        scope = entry.get('scope', 'private').lower()
        
        if owner_id == current_user.id:
            return True
        if scope == 'global':
            return True
        return False

    return [h for h in all_history if is_visible(h)]

@app.post("/forget")
async def forget_endpoint(request: ForgetRequest, current_user: models.User = Depends(auth.get_current_user)):
    # 1. Verify Ownership / Permission
    history = load_history()
    target_entry = next((h for h in history if h['filename'] == request.filename), None)
    
    if not target_entry:
         raise HTTPException(status_code=404, detail="Memory not found")
    
    owner_id = target_entry.get('user_id')
    scope = target_entry.get('scope', 'private').lower()
    
    # Rules:
    # 1. Admin can delete anything.
    # 2. User can delete OWN private files.
    # 3. User CANNOT delete Global files (even if they uploaded them? No, Global is Admin territory usually).
    #    But if User uploaded a global file (which they can't anymore), Admin accounts for that.
    
    is_admin = (current_user.role == 'admin')
    is_owner = (owner_id == current_user.id)
    is_global = (scope == 'global')
    
    if is_global and not is_admin:
         raise HTTPException(status_code=403, detail="Only Admins can delete Global memories")
         
    if not is_admin and not is_owner:
         raise HTTPException(status_code=403, detail="You do not own this memory")

    # 2. Proceed with Delete
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
async def train_endpoint(
    file: UploadFile = File(...), 
    scope: str = Form("private"),
    current_user: models.User = Depends(auth.get_current_user)
):
    content = await file.read()
    text = content.decode("utf-8")
    
    if scope == "global":
        if current_user.role != "admin":
            raise HTTPException(status_code=403, detail="Only Admins can train Global memory")
        target_user_id = None
    else:
        target_user_id = current_user.id
    
    file_path = os.path.join(DATA_STORE_DIR, file.filename)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(text)

    rag_engine.add_documents([text], metadatas=[{"source": file.filename}], user_id=target_user_id)
    
    # Only Admin updates global history
    if target_user_id is None:
        entry = {
            "filename": file.filename,
            "timestamp": datetime.datetime.now().isoformat(),
            "status": "Success (File)"
        }
        save_history(entry)
    
    status_msg = f"Training completed ({scope})"
    return {"filename": file.filename, "status": status_msg}

@app.post("/train-text")
async def train_text_endpoint(request: TrainTextRequest, current_user: models.User = Depends(auth.get_current_user)):
    if request.scope == "global":
        if current_user.role != "admin":
             raise HTTPException(status_code=403, detail="Only Admins can train Global memory")
        target_user_id = None
    else:
        target_user_id = current_user.id
        
    return train_text_internal(request.title, request.text, user_id=target_user_id)

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
