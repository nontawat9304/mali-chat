import { Component, ElementRef, ViewChild, OnInit, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ChatService, ChatResponse } from '../../services/chat.service';
import { AvatarComponent } from '../avatar/avatar.component';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div class="chat-container">
      <!-- Background watermark provided by CSS -->
      
      <div class="messages-area" #scrollContainer>
        <div *ngFor="let msg of messages" class="message" [ngClass]="msg.role">
          <!-- AI Avatar Icon -->
          <img *ngIf="msg.role === 'ai'" src="/chibi_idle.png" class="profile-icon ai-icon" alt="AI">
          
          <div class="bubble">{{ msg.text }}</div>

          <!-- User Avatar Icon -->
          <div *ngIf="msg.role === 'user'" class="profile-icon user-icon">👤</div>
        </div>
        
        <div *ngIf="isLoading" class="message ai">
          <img src="/chibi_idle.png" class="profile-icon ai-icon" alt="AI">
          <div class="bubble typing">
             ... (Thinking {{ loadingProgress | number:'1.0-0' }}%)
          </div>
        </div>
      </div>

      <div class="input-area">
        <div class="model-badge" [ngClass]="currentModel.includes('Cloud') ? 'cloud' : 'local'" title="Current Intelligence Source">
           {{ currentModel }}
        </div>
        
        <button (click)="clearChat()" class="mic-btn settings-btn" style="background: #e74c3c;" title="Clear Chat History">
          🗑️
        </button>

        <button (click)="openAdminGuide()" class="mic-btn settings-btn" title="Admin Manual / คู่มือผู้ดูแล">
           🛠️
        </button>

        <button (click)="openSettings()" class="mic-btn settings-btn" title="Settings / Change Server">
          ⚙️
        </button>
        <button (click)="toggleMute()" class="mic-btn" [class.muted]="isMuted" [title]="isMuted ? 'Unmute' : 'Mute Voice'">
          {{ isMuted ? '🔇' : '🔊' }}
        </button>
        <button (click)="toggleRecording()" [class.recording]="isRecording" class="mic-btn" [title]="isRecording ? 'Stop Recording' : 'Start Recording'">
          {{ isRecording ? '🟥' : '🎤' }}
        </button>
        <input type="text" [(ngModel)]="userInput" (keyup.enter)="sendMessage()" [placeholder]="isRecording ? 'Listening...' : 'Type a message...'" [disabled]="isLoading">
        <button (click)="sendMessage()" [disabled]="!userInput.trim() || isLoading">Send</button>
      </div>
    </div>
  `,
  styles: [`
    .chat-container {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 800px;
      margin: 0 auto;
      background: #f5f7fa;
      position: relative;
      overflow: hidden; /* contain the background */
    }
    
    /* Background Watermark */
    .chat-container::before {
        content: "";
        position: absolute;
        top: 0; 
        left: 0;
        width: 100%;
        height: 100%;
        background-image: url('/chibi_idle.png');
        background-size: 60%; /* Adjust size */
        background-position: center center;
        background-repeat: no-repeat;
        opacity: 0.1; /* Very faint transparency */
        z-index: 0;
        pointer-events: none;
    }

    .avatar-section { display: none; }
    
    .messages-area {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 15px;
      position: relative; /* Above watermark */
      z-index: 1;
    }
    .message {
      display: flex;
      align-items: flex-end; /* Align avatar to bottom of bubble */
      margin-bottom: 5px;
    }
    .profile-icon {
        width: 35px;
        height: 35px;
        border-radius: 50%;
        margin: 0 8px;
        object-fit: cover;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        background: white;
    }
    .user-icon {
        display: flex;
        justify-content: center;
        align-items: center;
        background: #007bff;
        color: white;
        font-size: 1.2rem;
    }
    
    .message.user {
      justify-content: flex-end;
    }
    .message.ai {
      justify-content: flex-start;
    }
    .bubble {
      padding: 10px 15px;
      border-radius: 15px;
      max-width: 70%;
      word-wrap: break-word;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }
    .user .bubble {
      background: #007bff;
      color: white;
      border-bottom-right-radius: 4px;
    }
    .ai .bubble {
      background: white;
      color: #333;
      border: 1px solid #eee;
      border-bottom-left-radius: 4px;
    }
    .input-area {
      padding: 15px;
      background: white;
      display: flex;
      gap: 10px;
      align-items: center;
      border-top: 1px solid #ddd;
      /* Ensure input area matches the bottom calculation */
      height: 75px; 
      box-sizing: border-box;
      position: relative; /* Above watermark */
      z-index: 1;
    }
    /* ... Buttons ... */
    input[type="text"] {
      flex: 1;
      padding: 10px;
      border: 1px solid #ccc;
      border-radius: 20px;
      outline: none;
    }
    button {
      padding: 10px 20px;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      background: #007bff;
      color: white;
      transition: background 0.2s;
    }
    button:disabled {
      background: #ccc;
    }
    .mic-btn {
      background: #6c757d;
      border-radius: 50%;
      width: 45px;
      height: 45px;
      padding: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.2rem;
    }
    .mic-btn.recording {
        background: #dc3545;
        animation: pulse 1.5s infinite;
    }
    .upload-btn {
        cursor: pointer;
        font-size: 1.5rem;
        padding: 5px;
        margin-right: 5px;
    }
    @keyframes pulse {
        0% { opacity: 1; transform: scale(1); }
        50% { opacity: 0.8; transform: scale(1.1); }
        100% { opacity: 1; transform: scale(1); }
    }
    .mic-btn.muted {
        background: #e74c3c;
    }
    .settings-btn {
        background: #34495e;
        color: white;
    }
    .settings-btn:hover {
        background: #2c3e50;
    }
    .model-badge {
        font-size: 0.7rem;
        padding: 5px 10px;
        border-radius: 12px;
        background: #333;
        color: white;
        margin-right: 5px;
        white-space: nowrap;
        font-weight: bold;
        opacity: 0.8;
    }
    .model-badge.cloud {
        background: linear-gradient(135deg, #1e90ff, #00bfff);
    }
    .model-badge.local {
        background: linear-gradient(135deg, #2ecc71, #27ae60);
    }
  `]
})
export class ChatComponent implements OnInit {
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  messages: Message[] = [];
  userInput = '';
  isLoading = false;
  isRecording = false;
  isMuted = true; // Default to muted per user request
  retryCount = 0; // Track retries for no-speech
  currentModel = 'Ready';
  avatarState: 'idle' | 'talking' = 'idle';

  private recognition: any; // WebkitSpeechRecognition

  constructor(private chatService: ChatService, private ngZone: NgZone, private router: Router) { }

  openAdminGuide() {
    this.router.navigate(['/admin-guide']);
  }

  loadingProgress = 0;
  private progressInterval: any;

  startProgress() {
    this.loadingProgress = 0;
    this.progressInterval = setInterval(() => {
      if (this.loadingProgress < 90) {
        this.loadingProgress += 2 + Math.random() * 3;
      } else {
        this.loadingProgress += 0.5;
      }
      if (this.loadingProgress > 99) this.loadingProgress = 99;
    }, 200);
  }

  stopProgress() {
    clearInterval(this.progressInterval);
    this.loadingProgress = 0;
  }

  completeProgress() {
    clearInterval(this.progressInterval);
    this.loadingProgress = 100;
    setTimeout(() => this.loadingProgress = 0, 800);
  }

  ngOnInit() {
    this.messages = this.chatService.getMessages();
    this.initSpeechRecognition(); // Client-side STT
    if (this.messages.length > 0) {
      setTimeout(() => this.scrollToBottom(), 100);
    }
  }

  // Client-Side STT (Web Speech API)

  initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window) {
      // @ts-ignore
      this.recognition = new webkitSpeechRecognition();
      this.recognition.continuous = false; // Stop after one sentence
      this.recognition.interimResults = true; // Show real-time text
      this.recognition.lang = 'th-TH';

      this.recognition.onstart = () => {
        this.ngZone.run(() => {
          this.isRecording = true;
          this.retryCount = 0; // Reset retry count on a new start
          if (this.retryCount === 0) {
            this.userInput = '...'; // Visual cue
          }
        });
      };

      this.recognition.onresult = (event: any) => {
        this.ngZone.run(() => {
          let interimTranscript = '';
          let finalTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }

          if (interimTranscript) {
            this.userInput = interimTranscript + ' ...';
          }

          if (finalTranscript) {
            this.userInput = finalTranscript;
            this.sendMessage(); // Auto-send enabled
          }
        });
      };

      this.recognition.onerror = (event: any) => {
        this.ngZone.run(() => {
          console.error('Speech recognition error:', event.error);
          this.isRecording = false;

          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow permission.');
          } else if (event.error === 'no-speech') {
            // Just notify, don't mess with input
            // alert('No speech detected. Please try again.'); // Optional: too annoying?
          } else {
            // Other errors
            this.userInput = `Error: ${event.error} `;
          }
        });
      };

      this.recognition.onend = () => {
        this.ngZone.run(() => {
          this.isRecording = false;
        });
      };
    } else {
      console.warn('Web Speech API not supported');
    }
  }

  toggleRecording() {
    if (!this.recognition) {
      this.initSpeechRecognition(); // Try lazy init
      if (!this.recognition) {
        alert('Browser does not support Speech API');
        return;
      }
    }

    if (this.isRecording) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }




  // ... (existing methods)

  sendMessage() {
    if (!this.userInput.trim() || this.isLoading) return;

    const text = this.userInput;
    this.addMessage('user', text);
    this.userInput = '';
    this.isLoading = true;
    this.startProgress();

    this.chatService.sendMessage(text, this.isMuted).subscribe({
      next: (res) => {
        this.completeProgress();
        this.addMessage('ai', res.reply);
        if (res.model_source) {
          this.currentModel = res.model_source;
        }
        if (res.audio_url && !this.isMuted) {
          this.playAudio(res.audio_url);
        }
        this.isLoading = false;
      },
      error: (err) => {
        this.stopProgress();
        console.error(err);
        this.addMessage('ai', 'Something went wrong. Please try again.');
        this.isLoading = false;
      }
    });
  }



  addMessage(role: 'user' | 'ai', text: string) {
    this.chatService.addMessage(role, text);
    setTimeout(() => this.scrollToBottom(), 100);
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  playAudio(url: string) {
    if (this.isMuted) return; // Don't play if muted

    const fullUrl = url.startsWith('http') ? url : `http://localhost:8000${url}`;
    const audio = new Audio(fullUrl);

    this.avatarState = 'talking';
    audio.onended = () => {
      this.avatarState = 'idle';
    };
    audio.play().catch(e => console.error('Audio play failed', e));
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
  }

  onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.addMessage('user', `Teaching AI with: ${file.name}...`);
      this.chatService.uploadFile(file).subscribe({
        next: (res) => {
          this.addMessage('ai', `I have memorized the content of ${file.name}!`);
        },
        error: (err) => {
          console.error(err);
          this.addMessage('ai', 'Failed to read file.');
        }
      });
    }
  }

  openSettings() {
    const currentUrl = localStorage.getItem('custom_api_url') || 'http://localhost:8000';
    const newUrl = prompt('🔗 Enter Backend API URL (for Google Colab):\nLeave empty to reset to Localhost.', currentUrl);

    if (newUrl !== null) {
      if (newUrl.trim() === '') {
        this.chatService.resetApiUrl();
      } else if (newUrl !== currentUrl) {
        this.chatService.setApiUrl(newUrl.trim());
      }
    }
  }

  clearChat() {
    if (confirm('Are you sure you want to clear the chat history?')) {
      this.chatService.clearMessages();
      this.messages = [];
      this.addMessage('ai', 'Chat history cleared! ความจำหายวับเลยค่ะ ✨');
    }
  }
}
