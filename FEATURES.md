# Mali-Chat — Feature Summary

อัปเดตล่าสุด: 2026-06-21 (เพิ่ม Gemini File API + ปรับ memory)

---

## สถาปัตยกรรม

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | Angular 21, standalone components, HttpClient, AuthGuard, JWT Interceptor |
| Backend | Python FastAPI, SQLite (SQLAlchemy), JWT Auth |
| AI Engine | Google Gemini / LM Studio / Colab GPU / Local Qwen (เลือกได้ใน .env) |
| Memory | FAISS + SentenceTransformer (all-MiniLM-L6-v2) |
| TTS | Microsoft Edge TTS (th-TH-PremwadeeNeural) |
| STT | Web Speech API (client-side), Google Speech Recognition (server-side) |

---

## ฟีเจอร์ที่ทำงานได้ในปัจจุบัน

### 1. Authentication
- สมัครสมาชิกด้วย Email + Password + Nickname
- Login/Logout ด้วย JWT Token (หมดอายุ 24 ชั่วโมง)
- ผู้ใช้คนแรกที่สมัครจะได้รับสิทธิ์ Admin อัตโนมัติ
- Route Guard ป้องกันหน้าที่ต้อง login และหน้า Admin
- Token ถูก inject ทุก request ผ่าน Angular Interceptor
- Auto logout เมื่อ token หมดอายุ (401) หรือ server ไม่ตอบสนอง

### 2. Chat
- คุยกับ AI มะลิเป็นภาษาไทย
- บทสนทนาย้อนหลัง **20 ข้อความ** ถูกส่งไปให้ AI ทุกครั้ง (AI จำบทสนทนาได้ต่อเนื่อง)
- **Auto-summary**: ทุกๆ 20 ข้อความ จะสรุปบทสนทนาและเก็บลง RAG อัตโนมัติ (จำระยะยาวได้)
- แสดง badge บอกว่าใช้ AI ตัวไหนอยู่ (Cloud/Local)
- ล้างประวัติการแชทได้
- รองรับการพิมพ์และกด Enter
- แสดงภาพ chibi เป็น avatar และ watermark พื้นหลัง

### 3. Voice Chat
- กดปุ่มไมค์เพื่อพูด (Web Speech API, Thai)
- ข้อความที่พูดจะถูกส่งอัตโนมัติเมื่อตรวจพบประโยคสมบูรณ์
- ปุ่ม mute/unmute เสียงตอบกลับของ AI
- AI ตอบกลับด้วยเสียง Edge TTS (th-TH-PremwadeeNeural)

### 4. Memory System (RAG)
- ความทรงจำแบ่งเป็น 2 ระดับ: Global (ทุกคนเห็น) และ Private (เฉพาะผู้ใช้นั้น)
- สั่งให้ AI จำในแชทได้โดยตรง เช่น "จำไว้ว่า...", "ช่วยจำหน่อยว่า..."
- เปลี่ยนชื่อที่ AI เรียกได้โดยพิมพ์ "เรียกผมว่า..." หรือ "call me..." (บันทึกถาวรใน DB)
- AI ดึงข้อมูลจาก FAISS vector store ทั้ง global + private **สูงสุด 15 chunks** ทุกครั้งที่ตอบ
- Auto-summary ทุก 20 ข้อความ → เก็บลง RAG เพื่อจำระยะยาวข้ามวัน

### 5. Deep Read — Gemini File API
- อัปโหลดไฟล์ให้ AI เข้าใจได้ทั้งหมด: ข้อความ, ตาราง, รูปภาพ, PDF สแกน
- รองรับ: `.pdf`, `.docx`, `.xlsx`, `.csv`, `.txt`, `.md`, `.png`, `.jpg`, `.jpeg`
- ไฟล์ถูก upload ไปเก็บที่ Gemini File API (มีอายุ 48 ชั่วโมง) และ URI เก็บใน DB
- ทุกครั้งที่ chat จะดึงไฟล์ทั้งหมดของ user + global มาแนบให้ AI เห็นพร้อมกัน
- ต้องมี `GOOGLE_API_KEY` ใน `.env` (ใช้ได้ฟรีจาก AI Studio)
- ถ้าไม่มี Google API Key หรือ upload ล้มเหลว จะ fallback กลับ RAG เดิมอัตโนมัติ

### 5. Training (สอน AI)
- อัปโหลดไฟล์ (.txt, .md, .pdf, .docx) เพื่อเพิ่มความรู้ให้ AI
- พิมพ์ข้อความสอน AI โดยตรง (ระบุ Title + Content)
- ดูรายการที่สอนไปทั้งหมด พร้อม search และ pagination
- แก้ไขเนื้อหาไฟล์ที่สอนไปแล้วได้ (inline editor)
- ลบความทรงจำและ rebuild index ใหม่อัตโนมัติ
- ดาวน์โหลดไฟล์ที่สอนไปแล้วได้

### 6. Admin Dashboard (เฉพาะ Admin)
- จัดการผู้ใช้: ดู, Ban/Unban, Promote/Demote, ลบ
- ป้องกันการแก้ไข Super Admin (ID = 1)
- แก้ไข Global Persona ของ AI (System Prompt สำหรับทุกคน)
- จัดการ Global Knowledge Base (อัปโหลด/ลบ/แก้ไขข้อมูลที่ทุกคนใช้ร่วมกัน)
- ดูคู่มือ Admin ได้ในหน้าเดียวกัน

### 7. AI Engine (เลือกได้ใน backend/.env)
| Provider | วิธีตั้งค่า | หมายเหตุ |
|---|---|---|
| Google Gemini | `LLM_PROVIDER=gemini` + `GOOGLE_API_KEY=...` | แนะนำ, ฟรีมี quota |
| LM Studio | `LLM_PROVIDER=lmstudio` + `OPENAI_BASE_URL=...` | Local GPU |
| Colab GPU | `LLM_PROVIDER=colab` + `OPENAI_BASE_URL=ngrok_url` | Colab + Ngrok |
| Local GGUF | `LLM_PROVIDER=local` + `LOCAL_MODEL_PATH=...` | ต้องมี llama-cpp-python |
| Local HuggingFace | `LLM_PROVIDER=local` (fallback) | Qwen2.5-1.5B, ใช้ CPU |

### 8. Sidebar & Navigation
- Chat, Training, Guide, Admin (เฉพาะ admin)
- ปุ่ม Logout
- แสดง Avatar ของ Mali

### 9. Guide
- คู่มือการใช้งานสำหรับผู้ใช้ทั่วไป
- ซ่อนส่วน Personality สำหรับ non-admin

---

## สิ่งที่ยังไม่มี / TODO
- [ ] ระบบแจ้งเตือน (Notification)
- [ ] Dark mode
- [ ] รองรับภาษาอื่นนอกจากไทย
- [ ] Export/Import ประวัติการแชท
- [ ] ระบบ Conversation Session (แยกห้องแชท)
