import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-admin-guide',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="guide-container">
      <div class="header">
        <h1>🛠️ Admin Manual (คู่มือผู้ดูแลระบบ)</h1>
        <a routerLink="/chat" class="back-btn">⬅ Back to Chat</a>
      </div>

      <div class="content">
        <section>
          <h2>1. ☁️ การตั้งค่า Google Colab (Cloud Brain)</h2>
          <p>หากต้องการให้ AI ฉลาดขึ้น (ใช้ ThaiLLM-8B) ต้องรันผ่าน Google Colab ฟรี:</p>
          <ol>
            <li>ไปที่ <a href="https://colab.research.google.com/" target="_blank">Google Colab</a></li>
            <li>อัปโหลดไฟล์ <code>colab_backend.ipynb</code> (อยู่ในโฟลเดอร์โปรเจค)</li>
            <li>สมัครสมาชิก <a href="https://dashboard.ngrok.com/" target="_blank">Ngrok</a> เพื่อเอา <strong>Authtoken</strong></li>
            <li>ใส่ Token ในช่อง <code>ngrok.set_auth_token("...")</code> ใน Colab</li>
            <li>กดรันทุก Cell (Runtime -> Run all)</li>
            <li>รอจนได้ลิ้งค์ <code>Running on http://xxxx.ngrok-free.app</code></li>
            <li>นำลิ้งค์มาใส่ในหน้า Chat (กดปุ่ม ⚙️)</li>
          </ol>

          <div class="alert warning">
             <strong>⚠️ ข้อควรระวัง:</strong> Colab ฟรีจะตัดสัญญานหากหน้าจอดับหรือไม่กดอะไรนานๆ
          </div>

          <h3>⚡ สคริปต์กันหลับ (Keep Alive)</h3>
          <p>เพื่อป้องกัน Colab ตัดเน็ต ให้กด F12 ที่หน้า Colab -> Console -> วางโค้ดนี้แล้วกด Enter:</p>
          <pre><code>
function ClickConnect()&#123;
    console.log("Working to keep connection alive..."); 
    document.querySelector("colab-connect-button").click() 
&#125;
setInterval(ClickConnect, 60000)
          </code></pre>
        </section>

        <section>
          <h2>2. 🧠 การเปลี่ยนโมเดล (Change AI Model)</h2>
          
          <h3>แบบ Local (คอมพิวเตอร์ตัวเอง)</h3>
          <p>แก้ไขไฟล์ <code>backend/llm_engine.py</code>:</p>
          <pre ngNonBindable><code>model_id = "Qwen/Qwen2.5-1.5B-Instruct" # เปลี่ยนชื่อโมเดลตรงนี้</code></pre>
          <p><em>แนะนำให้ใช้โมเดลขนาดเล็ก ( < 3B) หากไม่มีการ์ดจอแยก</em></p>

          <h3>แบบ Cloud (Google Colab)</h3>
          <p>แก้ไขในไฟล์ Notebook (Cell แรก):</p>
          <pre ngNonBindable><code>model_id = "wannaphong/ThaiLLM-8B-v0.1" # เปลี่ยนเป็นโมเดลที่ต้องการ</code></pre>
          <p><em>แนะนำ 4-bit Quantized เพื่อความเร็ว</em></p>
        </section>

        <section>
          <h2>3. 🗑️ การลบความจำ (Reset Memory)</h2>
          <p>หากต้องการลบความจำระยะยาว ทั้งหมด:</p>
          <ul>
            <li>ไปที่โฟลเดอร์ <code>backend/training_data.json</code> -> ลบไฟล์ทิ้งหรือแก้ไข content</li>
            <li>ไปที่โฟลเดอร์ <code>backend/chroma_db</code> -> ลบทั้งโฟลเดอร์ (ระบบจะสร้างใหม่เอง)</li>
          </ul>
        </section>
      </div>
    </div>
  `,
  styles: [`
    .guide-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      font-family: 'Inter', sans-serif;
      color: #000 !important; /* Force Black */
      background: #fff !important; /* Force White BG */
      min-height: 80vh; /* Ensure height */
      border: 1px solid #eee;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 2px solid #eee;
    }
    h1 { font-size: 1.8rem; color: #2c3e50; }
    h2 { color: #3498db; margin-top: 30px; border-left: 5px solid #3498db; padding-left: 10px; }
    h3 { color: #e67e22; margin-top: 20px; }
    p, li { line-height: 1.6; font-size: 1rem; color: #555; }
    code { background: #f8f9fa; padding: 2px 5px; border-radius: 4px; font-family: monospace; color: #d63384; }
    pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 15px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 10px 0;
    }
    .back-btn {
      text-decoration: none;
      color: #555;
      font-weight: bold;
      padding: 8px 16px;
      border: 1px solid #ddd;
      border-radius: 20px;
      transition: all 0.2s;
    }
    .back-btn:hover {
      background: #f8f9fa;
      color: #000;
    }
    .alert {
      padding: 15px;
      border-radius: 8px;
      margin: 20px 0;
    }
    .alert.warning {
      background: #fff3cd;
      color: #856404;
      border: 1px solid #ffeeba;
    }
    a { color: #3498db; }
  `]
})
export class AdminGuideComponent { }
