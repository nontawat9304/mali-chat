"""
Gemini File API Service
-----------------------
อัปโหลดไฟล์ให้ Gemini เข้าใจได้ทั้งหมด — ข้อความ ตาราง รูปภาพ PDF สแกน
ไฟล์จะถูกเก็บใน Gemini Files (มีอายุ 48 ชั่วโมง) และ URI เก็บใน DB
"""

import os
import mimetypes
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

# Supported MIME types for Gemini File API
SUPPORTED_MIME_TYPES = {
    ".pdf":  "application/pdf",
    ".txt":  "text/plain",
    ".md":   "text/plain",
    ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".doc":  "application/msword",
    ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".xls":  "application/vnd.ms-excel",
    ".csv":  "text/csv",
    ".png":  "image/png",
    ".jpg":  "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif":  "image/gif",
}


def is_gemini_available() -> bool:
    return bool(os.getenv("GOOGLE_API_KEY"))


def get_mime_type(filename: str) -> str:
    ext = os.path.splitext(filename)[1].lower()
    return SUPPORTED_MIME_TYPES.get(ext, "application/octet-stream")


def is_supported_file(filename: str) -> bool:
    ext = os.path.splitext(filename)[1].lower()
    return ext in SUPPORTED_MIME_TYPES


def upload_file_to_gemini(file_path: str, display_name: str) -> dict:
    """
    อัปโหลดไฟล์ไปยัง Gemini File API
    Returns: {"uri": str, "name": str, "mime_type": str}
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set in .env")

    genai.configure(api_key=api_key)

    mime_type = get_mime_type(display_name)
    print(f"📤 Uploading '{display_name}' to Gemini File API ({mime_type})...")

    uploaded = genai.upload_file(
        path=file_path,
        display_name=display_name,
        mime_type=mime_type,
    )

    print(f"✅ Uploaded: {uploaded.name} | URI: {uploaded.uri}")
    return {
        "uri": uploaded.uri,
        "name": uploaded.name,
        "mime_type": mime_type,
    }


def delete_file_from_gemini(gemini_file_name: str):
    """ลบไฟล์ออกจาก Gemini Files"""
    try:
        api_key = os.getenv("GOOGLE_API_KEY")
        if not api_key:
            return
        genai.configure(api_key=api_key)
        genai.delete_file(gemini_file_name)
        print(f"🗑️ Deleted from Gemini: {gemini_file_name}")
    except Exception as e:
        print(f"Warning: Could not delete Gemini file {gemini_file_name}: {e}")


def extract_content_from_file(file_path: str, display_name: str) -> str:
    """
    ให้ Gemini อ่านไฟล์ทั้งหมดแล้วสกัดเนื้อหาออกมาเป็น text ครั้งเดียว
    รองรับ: PDF (สแกน+text), รูปภาพ, DOCX, ตาราง ฯลฯ
    text ที่ได้จะถูกเก็บลง FAISS เพื่อใช้ใน RAG ต่อไป
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    genai.configure(api_key=api_key)

    mime_type = get_mime_type(display_name)
    print(f"📖 Extracting content from '{display_name}' via Gemini...")

    # Upload ชั่วคราวเพื่ออ่าน
    uploaded = genai.upload_file(
        path=file_path,
        display_name=display_name,
        mime_type=mime_type,
    )

    model = genai.GenerativeModel("gemini-1.5-flash")

    extraction_prompt = """อ่านเอกสารนี้ทั้งหมดและสกัดเนื้อหาออกมาให้ครบถ้วน โดย:
1. คัดลอกข้อความทั้งหมดที่มีในเอกสาร
2. แปลงตารางเป็น markdown table
3. อธิบายรูปภาพหรือกราฟที่พบ
4. รักษาโครงสร้างหัวข้อและเนื้อหาให้ครบ
5. ห้ามสรุปหรือย่อ — ให้ดึงทุกอย่างออกมาให้ครบที่สุด

ตอบเป็นภาษาเดียวกับเอกสาร"""

    response = model.generate_content(
        [uploaded, extraction_prompt],
        generation_config=genai.types.GenerationConfig(
            temperature=0.1,  # ต่ำ เพื่อความแม่นยำ
            max_output_tokens=8192,
        ),
    )

    # ลบไฟล์ชั่วคราวออกจาก Gemini หลังอ่านแล้ว
    try:
        genai.delete_file(uploaded.name)
    except Exception:
        pass

    extracted = response.text.strip()
    print(f"✅ Extracted {len(extracted)} chars from '{display_name}'")
    return extracted


def query_files_with_gemini(
    user_message: str,
    file_records: list,
    persona_text: str,
    context_text: str = "",
) -> str:
    """
    ส่ง user message + ไฟล์ทั้งหมดให้ Gemini วิเคราะห์พร้อมกัน
    AI เห็น content ทั้งไฟล์ — ข้อความ ตาราง รูปภาพ ครบหมด
    """
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        raise ValueError("GOOGLE_API_KEY not set")

    genai.configure(api_key=api_key)
    model = genai.GenerativeModel("gemini-1.5-flash")

    # แนบไฟล์แต่ละตัว — กรองเฉพาะที่ยังมีอยู่ใน Gemini
    file_parts = []
    for f in file_records:
        try:
            gf = genai.get_file(f.gemini_file_name)
            file_parts.append(gf)
            print(f"📎 Attached: {f.filename}")
        except Exception as e:
            print(f"⚠️ File expired or missing ({f.filename}): {e}")

    # ถ้าไม่มีไฟล์ที่ attach ได้เลย → raise ให้ caller fallback ไป LLM ปกติ
    if not file_parts:
        raise ValueError("No valid Gemini files available (may have expired after 48h)")

    # Build prompt
    system_block = f"{persona_text}\n\n"
    if context_text:
        system_block += f"ข้อมูลเพิ่มเติม:\n{context_text}\n\n"
    system_block += f"คำถามของผู้ใช้: {user_message}"

    parts = file_parts + [system_block]

    response = model.generate_content(
        parts,
        generation_config=genai.types.GenerationConfig(
            temperature=0.7,
            max_output_tokens=800,
        ),
    )

    return response.text.strip()
