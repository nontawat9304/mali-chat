import llm_engine
import time

print("Loading Engine...")
start = time.time()
engine = llm_engine.get_engine()
print(f"Loaded in {time.time() - start:.2f}s")

prompt = "สวัสดี แนะนำตัวหน่อย"
context = "ชื่อ: มะลิจัง (Mali-chan) หน้าที่: ผู้ช่วย AI"
persona = "ร่าเริง สดใส"

print(f"Testing Generation with: {prompt}")
reply = engine.generate_reply(prompt, context, persona)
print("-" * 20)
print("REPLY:")
print(reply)
print("-" * 20)
