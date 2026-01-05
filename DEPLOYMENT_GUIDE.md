# 🚀 คู่มือการติดตั้งและย้ายโปรเจกต์ "Mali-Chan AI" ไปเครื่องใหม่

เอกสารนี้จะอธิบายขั้นตอนอย่างละเอียดที่สุด สำหรับการนำโปรเจกต์นี้ไปรันบนคอมพิวเตอร์เครื่องใหม่ โดยไม่ต้องพึ่งพา Google Colab (รันโมเดลในเครื่องตัวเอง 100%)

---

## 📋 1. สิ่งที่ต้องเตรียม (Prerequisites)
ก่อนเริ่มติดตั้ง ต้องมีโปรแกรมเหล่านี้ในเครื่องใหม่ก่อน:

### 1.1 โปรแกรมพื้นฐาน
1.  **Git:** สำหรับดึงโค้ดโปรเจกต์
    *   ดาวน์โหลด: [git-scm.com](https://git-scm.com/downloads)
    *   ติดตั้ง: กด Next ยาวๆ จนเสร็จ
2.  **Node.js (LTS Version):** สำหรับรันหน้าเว็บ (Frontend)
    *   ดาวน์โหลด: [nodejs.org](https://nodejs.org/) (เลือกเวอร์ชัน LTS)
    *   ติดตั้ง: กด Next จนเสร็จ
3.  **Python (3.10 ขึ้นไป):** สำหรับรัน AI Server (Backend)
    *   ดาวน์โหลด: [python.org](https://www.python.org/downloads/)
    *   **สำคัญมาก!:** ตอนติดตั้ง **ต้องติ๊กถูก** ช่อง `☑ Add Python to PATH` ก่อนกด Install

### 1.2 เครื่องมือสำหรับรัน AI Local (จำเป็นมาก!)
เนื่องจากเราจะรันโมเดล `.gguf` ในเครื่อง เครื่องใหม่ต้องมีตัว Compile โค้ด C++
1.  **Visual Studio Build Tools 2022:**
    *   ดาวน์โหลด: [visualstudio.microsoft.com](https://visualstudio.microsoft.com/visual-cpp-build-tools/)
    *   ตอนติดตั้ง ให้ติ๊กเลือก **"Desktop development with C++"**
    *   กด Install (ใช้เวลาดาวน์โหลดสักพัก ใหญ่หน่อยครับ ~6-7GB)
2.  **FFmpeg (สำคัญมาก! สำหรับเสียง):**
    *   ดาวน์โหลด: [gyan.dev](https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip)
    *   แตกไฟล์ zip แล้วเข้าไปในโฟลเดอร์ `bin` จะเจอไฟล์ `ffmpeg.exe`
    *   **ให้ copy ไฟล์ `ffmpeg.exe` มาวางไว้ในโฟลเดอร์ `backend` ของโปรเจกต์** (วางคู่กับไฟล์ main.py)

---

## 📥 2. ขั้นตอนการติดตั้ง (Installation)

### 2.1 ดึงโปรเจกต์มาลงเครื่อง
เปิด **Command Prompt (cmd)** หรือ **PowerShell** แล้วพิมพ์คำสั่ง:
```bash
# ไปที่ไดร์ฟที่ต้องการ (เช่น C:)
cd C:\

# สร้างโฟลเดอร์เก็บงาน (ถ้ายังไม่มี)
mkdir Project
cd Project

# ดึงโค้ดจาก Git (ใช้ URL ของ Git ของคุณ)
git clone https://github.com/nontawat9304/mali-chat.git AInote

# เข้าไปในโฟลเดอร์โปรเจกต์
cd AInote
```

---

### 2.2 ติดตั้งฝั่ง Backend (AI Server)
```bash
# 1. เข้าไปโฟลเดอร์ backend
cd backend

# 2. สร้างจำลอง Environment (เพื่อไม่ให้ตีกับโปรแกรมอื่น)
python -m venv venv

# 3. เปิดใช้งาน Environment (สังเกตจะมีคำว่า (venv) สีเขียวขึ้นหน้าบรรทัด)
# (Windows)
.\venv\Scripts\activate

# 4. ติดตั้ง Library (เลือกตามการ์ดจอที่มี)

**👉 สำหรับเครื่องทั่วไป (CPU) หรือ Intel Graphics (ง่ายสุด):**
```bash
# ลง Library พื้นฐาน
pip install google-generativeai
pip install -r requirements.txt

# ลง llama-cpp-python แบบสำเร็จรูป (ไม่ต้องคอมไพล์)
pip install llama-cpp-python --prefer-binary --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cpu
```

**👉 สำหรับคนใช้การ์ดจอ NVIDIA (RTX/GTX) - **แนะนำให้ทำ! เร็วขึ้น 10 เท่า****
ต้องลง **CUDA Toolkit 12** ก่อน (โหลดที่ Nvidia) แล้วพิมพ์คำสั่งนี้:
```bash
# ลง Library พื้นฐาน
pip install google-generativeai
pip install -r requirements.txt

# ตั้งค่าให้ใช้ CUDA
set CMAKE_ARGS=-DGGML_CUDA=on

# บังคับลง llama-cpp-python ใหม่แบบเปิด GPU
# (เราใช้ --prefer-binary เพื่อพยายามโหลดตัวสำเร็จรูปก่อน ถ้าไม่มีมันจะ Compile ให้เอง)
pip install llama-cpp-python --force-reinstall --no-cache-dir --upgrade --extra-index-url https://abetlen.github.io/llama-cpp-python/whl/cu124
```

**👉 สำหรับคนใช้ AMD (Vulkan Mode):**
```bash
# ลง Library พื้นฐาน
pip install google-generativeai
pip install -r requirements.txt

# ตั้งค่าให้ใช้ Vulkan (ต้องลง Vulkan SDK ก่อน)
set CMAKE_ARGS=-DGGML_VULKAN=1
pip install llama-cpp-python --force-reinstall --no-cache-dir --upgrade
```
```

> **หมายเหตุ:** ถ้าเจอ Error สีแดงๆ เกี่ยวกับ `llama-cpp-python` ให้เช็คว่าลง **Visual Studio Build Tools (C++)** ครบถ้วนแล้วหรือยัง

---

### 2.3 ติดตั้งฝั่ง Frontend (หน้าเว็บ)
เปิดหน้าต่าง cmd ใหม่ (หรือถอยออกมาที่ root folder)
```bash
# ถอยออกมาที่ folder หลัก
cd ..
cd frontend

# ติดตั้ง dependencies
npm install
```

---

## 🧠 3. การติดตั้งโมเดล AI (Local Model)
อันนี้สำคัญที่สุด เพื่อให้ AI ตอบได้โดยไม่ต้องต่อ Colab

1.  ไปที่โฟลเดอร์: `C:\Project\AInote\backend\models\`
    *   (ถ้าไม่มีโฟลเดอร์ `models` ให้สร้างขึ้นมาใหม่ใน `backend`)
2.  **สำคัญ:** ไฟล์โมเดล `.gguf` **จะไม่ได้ติดมากับ Git** (เพราะไฟล์ใหญ่เกิน)
    *   คุณต้อง **Copy ไฟล์ `ThaiLLM-8B-Instruct.Q8_0.gguf` จากเครื่องเก่า** ใส่ Flash Drive หรือ Google Drive มาวางไว้ที่โฟลเดอร์นี้เอง
3.  **ตั้งค่า:** เปิดไฟล์ `backend/.env` (ใช้ Notepad แก้ได้) แล้วดูบรรทัดนี้:
    ```ini
    # เลือกโหมดทำงานเป็น local
    LLM_MODE=local

    # ระบุชื่อไฟล์โมเดลให้ตรงกับที่วางไว้
    MODEL_PATH=models/ThaiLLM-8B-Instruct.Q8_0.gguf
    ```
    *   *(ถ้าไม่มีไฟล์ .env ให้ก๊อปปี้ .env.example มาเปลี่ยนชื่อเป็น .env)*

---

## 🚀 4. วิธีเริ่มใช้งาน (Start App)

### วิธีที่ 1: กดทีเดียวจบ (แนะนำ ⭐)
ผมทำไฟล์ **Shortcut** ไว้ให้แล้ว
1.  กลับไปที่โฟลเดอร์หลัก `C:\Project\AInote\`
2.  ดับเบิ้ลคลิกไฟล์ `start_app.bat`
3.  รอสักพัก... มันจะเปิดหน้าเว็บ `http://localhost:4200` ขึ้นมาให้เอง
4.  หน้าจอดำๆ 2 หน้าต่างที่เด้งขึ้นมา คือ Server **(ห้ามปิด)**

### วิธีที่ 2: รันแยกทีละส่วน (เผื่อเอาไว้แก้ปัญหา)
**Terminal 1 (Backend):**
```bash
cd backend
venv\Scripts\activate
uvicorn main:app --reload --port 8000
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm start
```

---

## 🛠️ 5. วิธีแก้ปัญหาเบื้องต้น (Troubleshooting)

**Q: รัน start_app.bat แล้วหน้าจอเด้งแล้วปิดทันที?**
A: แปลว่ามี Error ให้ลองเปิด cmd แล้วรัน `python backend/main.py` ดู error log ครับ ส่วนใหญ่มักจะลืม Activate venv หรือ ลืมลง Library

**Q: AI ตอบช้ามาก?**
A: ถ้าเครื่องใหม่ไม่มีการ์ดจอแยก (GPU) แรงๆ AI จะรันด้วย CPU ซึ่งจะช้าเป็นปกติครับ
   *   **วิธีแก้:** ให้หา Model ที่ขนาดเล็กลง เช่น `Q4_K_M.gguf` (คุณภาพลดนิดหน่อย แต่เร็วขึ้นมาก) มาวางแทนตัว Q8_0

**Q: ฟ้องว่าหาไฟล์โมเดลไม่เจอ?**
A: เช็คชื่อไฟล์ใน `.env` ให้ตรงกับชื่อไฟล์จริงเป๊ะๆ (ระวังเรื่องนามสกุลซ้ำ เช่น `.gguf.gguf`)

---
**จบขั้นตอนครับ! ขอให้สนุกกับน้องมะลิบนเครื่องใหม่ครับ 🥳**
