import os
import sys
from dotenv import load_dotenv

# Load env manually
load_dotenv(".env")
base_url = os.getenv("OPENAI_BASE_URL")

print(f"🔍 Testing Connection to: {base_url}")

if not base_url or "ngrok" not in base_url:
    print("❌ URL ดูผิดปกติครับ (ต้องมี ngrok)")
    sys.exit(1)

try:
    from openai import OpenAI
    client = OpenAI(base_url=base_url, api_key="test")
    
    print("⏳ Sending Ping...")
    # List models is the lightest call
    models = client.models.list()
    print("✅ Connection SUCCESS!")
    print(f"📦 Model Found: {models.data[0].id}")
    
except Exception as e:
    print("\n❌ Connection FAILED!")
    print(f"Error Detail: {e}")
    print("\n👉 สาเหตุที่พบบ่อย:")
    print("1. Colab หยุดทำงาน (Timeout)")
    print("2. ลิ่งก์ Ngrok เปลี่ยน (ต้องก๊อปใหม่)")
