---
inclusion: always
---

# กฎที่ต้องอ่านก่อนแก้ไขโปรเจกต์นี้ทุกครั้ง

## 1. อัปเดต FEATURES.md ทุกครั้งที่แก้ฟีเจอร์
เมื่อเพิ่ม แก้ไข หรือลบฟีเจอร์ใดก็ตาม ให้ปรับปรุงไฟล์ `FEATURES.md` ให้ตรงกับสิ่งที่ทำเสมอ รวมถึงอัปเดตวันที่ "อัปเดตล่าสุด" ด้วย

## 2. โครงสร้างโปรเจกต์
- `frontend/` (Angular 21) อยู่ที่ `src/` — standalone components, HttpClient, JWT interceptor
- `backend/` (FastAPI) อยู่ที่ `backend/` — port 8002
- ห้ามเพิ่ม dependency ใหม่โดยไม่จำเป็น ให้ใช้ของที่มีอยู่แล้วก่อน

## 3. Authentication & Security
- JWT Token เก็บใน `sessionStorage` เท่านั้น (ไม่ใช้ localStorage สำหรับ token)
- ทุก endpoint ที่ต้องการ auth ต้องใช้ `Depends(auth.get_current_user)`
- Admin endpoint ต้องใช้ `Depends(auth.get_current_admin)`
- ห้ามแก้ไข Super Admin (user ID = 1) จาก UI หรือ API

## 4. Frontend Pattern
- ใช้ Angular `HttpClient` เท่านั้น ห้ามใช้ `fetch()` โดยตรง
- Logic ที่เกี่ยวกับ API call ต้องอยู่ใน Service (`*.service.ts`) ไม่ใช่ใน Component
- Route ที่ต้อง login ต้องผ่าน `AuthGuard`
- ใช้ inline template/styles ใน component ได้ (pattern ของ repo นี้)

## 5. Memory System
- Global memory = ทุกคนเห็น, เขียนได้เฉพาะ Admin
- Private memory = เฉพาะผู้ใช้นั้น, เขียนได้เอง
- เมื่อลบไฟล์จาก memory ต้อง rebuild FAISS index เสมอ (`rag_engine.rebuild_index`)

## 6. AI Engine
- Provider เลือกได้ผ่าน `backend/.env` (`LLM_PROVIDER=gemini|lmstudio|colab|local`)
- ห้าม hardcode API Key ในโค้ด ให้ใช้ `os.getenv()` + `.env` file เสมอ
- Secret Key ของ JWT อยู่ใน `backend/auth.py` — ควรย้ายไป `.env` เมื่อ deploy จริง

## 7. Database
- ใช้ SQLite (`ainote_users_v2.db`) สำหรับ Users และ ChatMessage
- Training history เก็บใน `training_history.json`
- ห้ามลบหรือ rename ไฟล์ database โดยตรง

## 8. การทดสอบ
- รัน backend: `cd backend && python -m uvicorn main:app --port 8002 --reload`
- รัน frontend: `npm start` (จาก root)
- Frontend เข้าที่ `http://localhost:4200` (หรือ port ที่ระบุ)
