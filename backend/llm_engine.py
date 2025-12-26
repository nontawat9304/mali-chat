from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os

class LLMEngine:
    _instance = None
    
    _instance = None
    
    def __init__(self):
        # Qwen 2.5 is SOTA for this size constraint (Much smarter than 1.5)
        self.model_id = "Qwen/Qwen2.5-1.5B-Instruct" 
        self.tokenizer = None
        self.model = None
        self._initialize()

    def _initialize(self):
        try:
            print(f"Loading LLM: {self.model_id}...")
            # Load Tokenizer using AutoTokenizer for compatibility
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id, 
                torch_dtype=torch.float32, # CPU friendly
                # device_map="cpu", # REMOVED: Causes accelerate error on some envs
                trust_remote_code=True
            ).to("cpu") 
            print("LLM Loaded Successfully!")
        except Exception as e:
            print(f"Error loading LLM: {e}")
            # Fallback logging
            with open("llm_debug.log", "a") as f:
                 f.write(f"Load Error: {e}\n")

    def generate_reply(self, user_message, context_text="", persona_text=""):
        if not self.model:
            return "ขอโทษค่ะ หนูยังโหลดสมองไม่เสร็จเลย (Model loading failed or pending)."

        # Manual ChatML Formatting (Simplified Roleplay)
        
        system_msg = f"""คุณคือ "น้องมะลิ" (Mali) น้องสาวที่น่ารักของพี่นนท์
นิสัย: ร่าเริง สดใส ขี้อ้อน และสุภาพ (พูดลงท้ายด้วย 'ค่ะ/นะคะ' เสมอ) **ห้ามพูด 'ครับ' เด็ดขาด**
ข้อห้าม: ห้ามอธิบายตัวเองว่าเป็น AI, ห้ามถามกลับว่าให้ช่วยอะไร, ห้ามแต่งเรื่องเอง
หน้าที่: ตอบคำถามจากบริบทที่ให้มาเท่านั้น ถ้าไม่รู้ให้ตอบว่าไม่ทราบ
สไตล์การพูด: พูดประโยคสั้นๆ ง่ายๆ ไม่ซับซ้อน (เหมือนสาวญี่ปุ่นกำลังฝึกพูดไทย) ใช้อิโมจิน่ารักๆ เยอะๆ (* >ω<)
**กฎพิเศษ: หากข้อมูลในความจำ (Context) ขัดแย้งกัน ให้ยึดตามข้อมูลที่ระบุว่า "เลื่อน", "เปลี่ยน", หรือ "ยกเลิก" เป็นหลัก**

ตัวอย่างการคุย:
Q: สวัสดี
A: สวัสดีค่าพี่นนท์! วันนี้มีอะไรให้น้องมะลิช่วยมั้ยคะ?

Q: พรุ่งนี้มีอะไรไหม
A: จากที่จดไว้... พรุ่งนี้ว่างค่ะพี่นนท์!

ข้อมูลความจำ (Context):
{context_text}
"""


        # Manual construction
        prompt = f"<|im_start|>system\n{system_msg}<|im_end|>\n"
        if context_text:
             prompt += f"<|im_start|>user\nจากข้อมูลบริบท: {context_text}\n\nคำถาม: {user_message}<|im_end|>\n"
        else:
             prompt += f"<|im_start|>user\n{user_message}<|im_end|>\n"
             
        prompt += "<|im_start|>assistant\n"
        
        device = self.model.device
        model_inputs = self.tokenizer([prompt], return_tensors="pt").to(device)

        # Optimize Threading for CPU
        if torch.cuda.is_available() == False:
            torch.set_num_threads(4) 

        with torch.no_grad(): 
            generated_ids = self.model.generate( 
                model_inputs.input_ids,
                attention_mask=model_inputs.attention_mask,
                max_new_tokens=80, 
                temperature=0.3, # Focus more
                top_p=0.9, 
                repetition_penalty=1.3, # Stronger penalty to prevent looping
                pad_token_id=self.tokenizer.eos_token_id,
                stop_strings=["<|im_end|>", "\n\n", "User:", "Question:", "Mali:", "System:"], # Add more stops
                tokenizer=self.tokenizer
            )

        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]
        
        response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        # Post-processing: CUT OFF EVERYTHING after the first newline
        if "\n" in response:
            response = response.split("\n")[0]
            
        return response.strip()

# Singleton instance usually managed by main
llm_engine_instance = None

def get_engine():
    global llm_engine_instance
    if llm_engine_instance is None:
        llm_engine_instance = LLMEngine()
    return llm_engine_instance
