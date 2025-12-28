from transformers import AutoTokenizer, AutoModelForCausalLM
import torch
import os
import google.generativeai as genai
import re # Added for cleaning <think> tags
from dotenv import load_dotenv

# Load env immediately
load_dotenv()

class LLMEngine:
    _instance = None
    
    def __init__(self):
        # Default to 'local' per user request, but allow 'gemini' override
        self.provider = os.getenv("LLM_PROVIDER", "local").lower() 
        self.local_model_path = os.getenv("LOCAL_MODEL_PATH") # Restore GGUF path
        self.api_key = os.getenv("GOOGLE_API_KEY")
        
        self.lm_client = None # For LM Studio
        
        self.model_id = "Qwen/Qwen2.5-1.5B-Instruct" 
        self.tokenizer = None
        self.model = None
        self.genai_model = None
        
        print(f"LLM Engine Strategy: {self.provider.upper()}")
        self._initialize()

    def _initialize(self):
        if self.provider == "gemini":
            if not self.api_key:
                print("CRITICAL: GOOGLE_API_KEY not found in .env. Falling back to Local.")
                self.provider = "local"
                self._init_local()
            else:
                self._init_gemini()
        elif self.provider in ["lmstudio", "colab"]:
             self._init_openai_compatible()
        else:
            self._init_local()

    def _init_gemini(self):
        try:
            print(f"Initializing Google Gemini...")
            genai.configure(api_key=self.api_key)
            self.genai_model = genai.GenerativeModel('gemini-1.5-flash') 
            print("Google Gemini Connected Successfully! (Cloud Mode: Gemini 1.5 Flash)")
        except Exception as e:
            print(f"Gemini Init Error: {e}")
            print("Fallback to Local...")
            self.provider = "local"
            self._init_local()

    def _init_openai_compatible(self):
        # Supports LM Studio, Colab-Llama-CPP, or any OpenAI-compatible API
        base_url = os.getenv("OPENAI_BASE_URL", "http://localhost:1234/v1")
        print(f"Initializing Remote Client at {base_url}...")
        
        try:
            from openai import OpenAI
            self.lm_client = OpenAI(base_url=base_url, api_key="sk-no-key-needed")
            print(f"✅ Remote AI Client Ready! ({base_url})")
        except Exception as e:
            print(f"❌ Remote Init Failed: {e}")
            self.provider = "local"
            self._init_local()

    def _init_local(self):
        # 1. Check for GGUF (Native Export from Colab)
        if self.local_model_path and os.path.exists(self.local_model_path):
             try:
                 print(f"🔌 Found Local GGUF Model: {self.local_model_path}")
                 print("Initializing llama.cpp engine...")
                 
                 from llama_cpp import Llama
                 self.model = Llama(
                     model_path=self.local_model_path,
                     n_ctx=4096, # Increased to 4096
                     n_gpu_layers=-1, # Offload all layers to GPU if available
                     verbose=True
                 )
                 print("✅ Native GGUF Model Loaded Successfully!")
                 return
             except ImportError:
                 print("⚠️ 'llama-cpp-python' not found! Please install it to run GGUF models.")
                 print("pip install llama-cpp-python")
             except Exception as e:
                 print(f"❌ Failed to load GGUF model: {e}")
                 print("Falling back to HuggingFace transformers...")

        # 2. Fallback to HuggingFace Transformers (Standard)
        try:
            print(f"Loading Local LLM (Transformers): {self.model_id}...")
            self.tokenizer = AutoTokenizer.from_pretrained(self.model_id, trust_remote_code=True)
            self.model = AutoModelForCausalLM.from_pretrained(
                self.model_id, 
                torch_dtype=torch.float32, 
                trust_remote_code=True
            ).to("cpu") 
            print("Local LLM Loaded Successfully!")
        except Exception as e:
            print(f"Error loading Local LLM: {e}")
            with open("llm_debug.log", "a") as f:
                 f.write(f"Load Error: {e}\n")

    def generate_reply(self, user_message, context_text="", persona_text=""):
        if self.provider == "gemini":
            return self._generate_gemini(user_message, context_text, persona_text)
        elif self.provider in ["lmstudio", "colab"]:
            return self._generate_openai_compatible(user_message, context_text, persona_text)
        else:
            return self._generate_local(user_message, context_text, persona_text)

    def _generate_gemini(self, user_message, context_text, persona_text):
        if not self.genai_model:
            return "ระบบ Google Gemini ยังไม่พร้อมใช้งานค่ะ (API Key Error?)"

        system_msg = self._build_system_prompt(context_text, persona_text)
        full_prompt = f"{system_msg}\n\nUser: {user_message}\nModel:"
        
        try:
            response = self.genai_model.generate_content(
                full_prompt,
                generation_config=genai.types.GenerationConfig(
                    temperature=0.7,
                    max_output_tokens=150,
                    stop_sequences=[
                        "User:", "Model:", "Mali:", "System:",
                        "\nUser:", "\nModel:", "\nMali:", "\nSystem:",
                        "\nQ:", "\nA:"
                    ]
                )
            )
            return response.text.strip()
        except Exception as e:
            print(f"Gemini Generation Error: {e}")
            return f"ขอโทษค่ะ ระบบ Cloud มีปัญหา ({e})"

    def _generate_openai_compatible(self, user_message, context_text, persona_text):
        if not self.lm_client:
            return "Remote AI Connection Failed. (Check Ngrok URL or LM Studio)"

        system_msg = self._build_system_prompt(context_text, persona_text)
        
        try:
            # Create messages for Chat Completion
            # Create messages for Chat Completion
            # STRATEGY: Merge System Prompt into User Message (Universal Compatibility for GGUF)
            # Some GGUF chat templates ignore 'system' role or hallucinate it.
            
            final_user_content = f"{system_msg}\n\n"
            if context_text:
                final_user_content += f"[Context/Memory]: {context_text}\n\n"
            
            final_user_content += f"[User Question]: {user_message}"

            messages = [
                {"role": "user", "content": final_user_content}
            ]

            completion = self.lm_client.chat.completions.create(
                model="tgi", # Llama-cpp-server usually ignores this, or use "model"
                messages=messages,
                temperature=0.7,
                max_tokens=600,
                stop=["<|im_end|>", "User:", "Mali:", "System:", "\nUser:", "\nMali:", "- ตอบ:", "Answer:", "<|endoftext|>"]
            )
            
            raw_reply = completion.choices[0].message.content.strip()
            print(f"DEBUG RAW LEN: {len(raw_reply)}") 
            
            # --- POST-PROCESSING: REMOVE THOUGHTS (ROBUST STRATEGY) ---
            # 1. Try splitting by closing tag </think>
            if "</think>" in raw_reply:
                clean_reply = raw_reply.split("</think>")[-1].strip()
            # 2. Try regex as fallback (for incomplete tags or <think> only)
            else:
                 clean_reply = re.sub(r'<think>.*', '', raw_reply, flags=re.DOTALL | re.IGNORECASE).strip()

            # 3. Clean "Answer:" prefix if present (common in Qwen)
            if clean_reply.startswith("Answer:") or clean_reply.startswith("- ตอบ:"):
                 clean_reply = re.sub(r'^(Answer:|- ตอบ:)\s*', '', clean_reply).strip()

            # 4. EMERGENCY CUTTER: If "Okay, the user" appears (English thought leak)
            if "Okay, the user" in clean_reply:
                clean_reply = clean_reply.split("Okay, the user")[0].strip()

            print(f"DEBUG FINAL: {clean_reply[:50]}...")
            return clean_reply
            
        except Exception as e:
            print(f"Remote AI Error: {e}")
            return f"เกิดข้อผิดพลาดกับ Remote Server: {e}"

    def _generate_local(self, user_message, context_text, persona_text):
        if not self.model:
            return "ขอโทษค่ะ หนูยังโหลดสมองไม่เสร็จเลย (Model loading failed or pending)."
        
        system_msg = self._build_system_prompt(context_text, persona_text)
        
        # --- PATH 1: LlamaCPP (Native GGUF) ---
        if hasattr(self.model, "create_chat_completion"): # Check if it's Llama object
            try:
                # ChatML Format is handled automatically by create_chat_completion usually, 
                # but explicit messages structure is safer.
                messages = [
                    {"role": "system", "content": system_msg},
                ]
                if context_text:
                     messages.append({"role": "user", "content": f"จากข้อมูลบริบท: {context_text}\n\nคำถาม: {user_message}"})
                else:
                     messages.append({"role": "user", "content": user_message})

                resp = self.model.create_chat_completion(
                    messages=messages,
                    max_tokens=600, # Increased from 150 to prevent cutting off
                    temperature=0.7,
                    stop=["<|im_end|>", "User:", "Mali:", "System:"] 
                )
                raw_reply = resp['choices'][0]['message']['content']
                
                # CLEANING: Remove <think>...</think> tags if they leak
                clean_reply = re.sub(r'<think>.*?</think>', '', raw_reply, flags=re.DOTALL)
                return clean_reply.strip()
            except Exception as e:
                print(f"GGUF Generation Error: {e}")
                return f"สมองรวน (GGUF Error): {e}"

        # --- PATH 2: Transformers (Standard) ---
        prompt = f"<|im_start|>system\n{system_msg}<|im_end|>\n"
        if context_text:
             prompt += f"<|im_start|>user\nจากข้อมูลบริบท: {context_text}\n\nคำถาม: {user_message}<|im_end|>\n"
        else:
             prompt += f"<|im_start|>user\n{user_message}<|im_end|>\n"
             
        prompt += "<|im_start|>assistant\n"
        
        device = self.model.device
        model_inputs = self.tokenizer([prompt], return_tensors="pt").to(device)

        if torch.cuda.is_available() == False:
            torch.set_num_threads(4) 

        with torch.no_grad(): 
            generated_ids = self.model.generate( 
                model_inputs.input_ids,
                attention_mask=model_inputs.attention_mask,
                max_new_tokens=80, 
                temperature=0.3,
                top_p=0.9, 
                repetition_penalty=1.3,
                pad_token_id=self.tokenizer.eos_token_id,
                stop_strings=["<|im_end|>", "\n\n", "User:", "Question:", "Mali:", "System:"],
                tokenizer=self.tokenizer
            )

        generated_ids = [
            output_ids[len(input_ids):] for input_ids, output_ids in zip(model_inputs.input_ids, generated_ids)
        ]
        
        response = self.tokenizer.batch_decode(generated_ids, skip_special_tokens=True)[0]
        
        if "\n" in response:
            response = response.split("\n")[0]
            
        return response.strip()

    def _build_system_prompt(self, context_text, persona_text):
        # Use provided persona, or fallback to default if empty
        if not persona_text or len(persona_text.strip()) < 10:
             # Default Fallback
             persona_text = """คุณคือ "น้องมะลิ" (Mali) น้องสาวที่น่ารักของพี่นนท์
นิสัย: ร่าเริง สดใส ขี้อ้อน และสุภาพ (พูดลงท้ายด้วย 'ค่ะ/นะคะ' เสมอ) **ห้ามพูด 'ครับ' เด็ดขาด**
ข้อห้าม: ห้ามอธิบายตัวเองว่าเป็น AI, ห้ามถามกลับว่าให้ช่วยอะไร, ห้ามแต่งเรื่องเอง
หน้าที่: ตอบคำถามจากบริบทที่ให้มาเท่านั้น ถ้าไม่รู้ให้ตอบว่าไม่ทราบ
สไตล์การพูด: พูดประโยคสั้นๆ ง่ายๆ ไม่ซับซ้อน (เหมือนสาวญี่ปุ่นกำลังฝึกพูดไทย) ใช้อิโมจิน่ารักๆ เยอะๆ (* >ω<)"""

        return f"""{persona_text}

**กฎพิเศษ: หากข้อมูลในความจำ (Context) ขัดแย้งกัน ให้ยึดตามข้อมูลที่ระบุว่า "เลื่อน", "เปลี่ยน", หรือ "ยกเลิก" เป็นหลัก**

ตัวอย่างการคุย:
Q: สวัสดี
A: สวัสดีค่าพี่นนท์! วันนี้มีอะไรให้น้องมะลิช่วยมั้ยคะ?

Q: พรุ่งนี้มีอะไรไหม
A: จากที่จดไว้... พรุ่งนี้ว่างค่ะพี่นนท์!

ข้อมูลความจำ (Context):
{context_text}
"""

llm_engine_instance = None

def get_engine():
    global llm_engine_instance
    if llm_engine_instance is None:
        llm_engine_instance = LLMEngine()
    return llm_engine_instance
