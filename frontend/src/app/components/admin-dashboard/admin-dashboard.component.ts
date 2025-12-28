import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { ChatService } from '../../services/chat.service';
import { AdminGuideComponent } from '../admin-guide/admin-guide.component';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, AdminGuideComponent, RouterLink],
  template: `
    <div class="admin-container">
      <header>
        <h1>👑 Admin Dashboard</h1>
        <a routerLink="/chat" class="back-link">⬅ Back to Chat</a>
      </header>

      <div class="tabs">
        <button [class.active]="activeTab === 'users'" (click)="activeTab = 'users'">👥 User Management</button>
        <button [class.active]="activeTab === 'persona'" (click)="activeTab = 'persona'">🎭 Global Persona</button>
        <button [class.active]="activeTab === 'training'" (click)="activeTab = 'training'">📚 Global Knowledge</button>
        <button [class.active]="activeTab === 'guide'" (click)="activeTab = 'guide'">📘 Admin Manual</button>
      </div>

      <!-- USERS TAB -->
      <div *ngIf="activeTab === 'users'" class="content-panel">
        <table class="user-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of users">
              <td>{{ user.id }}</td>
              <td>
                <div class="user-info">
                    <strong>{{ user.nickname }}</strong><br>
                    <small>{{ user.email }}</small>
                </div>
              </td>
              <td>
                <span class="badge" [class.admin]="user.role === 'admin'">{{ user.role }}</span>
              </td>
              <td>
                 <span class="status-dot" [class.active]="user.is_active"></span>
                 {{ user.is_active ? 'Active' : 'Banned' }}
              </td>
              <td>
                <!-- Toggle Ban (Don't allow banning ID 1) -->
                <button *ngIf="user.id !== 1" 
                        class="btn-toggle" 
                        [class.ban]="user.is_active"
                        (click)="toggleUserStatus(user)">
                  {{ user.is_active ? 'Ban' : 'Unban' }}
                </button>

                <!-- Toggle Role (Promote/Demote) - Don't touch ID 1 -->
                <button *ngIf="user.id !== 1"
                        class="btn-role"
                        [class.promote]="user.role === 'user'"
                        (click)="toggleRole(user)">
                    {{ user.role === 'user' ? '⬆️ Make Admin' : '⬇️ Demote' }}
                </button>

                <button *ngIf="user.id !== 1" 
                        class="btn-delete" 
                        (click)="deleteUser(user)">
                  🗑️
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- PERSONA TAB -->
      <div *ngIf="activeTab === 'persona'" class="content-panel">
        <div class="persona-editor">
          <h3>🎭 Global Persona (นิสัย AI บังคับใช้ทุกคน)</h3>
          <p class="hint">ข้อความนี้จะถูกส่งไปเป็น System Prompt ให้กับ User ทุกคน</p>
          <textarea [(ngModel)]="personaText" rows="15"></textarea>
          <button (click)="savePersona()" class="btn-save" [disabled]="saving">
            {{ saving ? 'Saving...' : '💾 Save Persona' }}
          </button>
        </div>
      </div>

      <!-- GLOBAL TRAINING TAB -->
      <div *ngIf="activeTab === 'training'" class="content-panel">
          <h3>📚 Global Knowledge Base (All Users)</h3>
          <p class="hint">ข้อมูลที่สอนในหน้านี้ User ทุกคนจะสามารถเข้าถึงและใช้งานได้ทันที</p>
          
          <div class="card">
              <h4>📄 Upload Knowledge File</h4>
              <input type="file" (change)="onAdminFileSelected($event)" class="file-input">
              <p *ngIf="uploadStatus" class="status-msg">{{ uploadStatus }}</p>
          </div>
          
          <div class="card" style="margin-top: 20px;">
               <h4>📝 Direct Text Training</h4>
               <input [(ngModel)]="trainTitle" placeholder="Title (e.g. Company Policy)" class="input-field">
               <textarea [(ngModel)]="trainText" rows="5" placeholder="Content to be memorized globally..." class="textarea-field"></textarea>
               <button (click)="adminTrainText()" class="btn-save" style="margin-top: 10px;">Train Global Memory</button>
          </div>
      </div>

      <!-- GUIDE TAB -->
      <div *ngIf="activeTab === 'guide'" class="content-panel">
        <app-admin-guide></app-admin-guide>
      </div>

    </div>
  `,
  styles: [`
    /* ... existing styles ... */
    .admin-container {
      max-width: 1000px;
      margin: 0 auto;
      padding: 30px;
      font-family: 'Inter', sans-serif;
    }
    h2, h3, h4 { color: #2c3e50; }
    p, li { color: #34495e; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }
    h1 { margin: 0; color: #d35400; }
    .back-link {
        text-decoration: none;
        color: #666;
        padding: 8px 15px;
        background: #f0f0f0;
        border-radius: 20px;
    }

    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
    }
    .tabs button {
      padding: 10px 20px;
      border: none;
      background: #eee;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
      transition: all 0.2s;
    }
    .tabs button.active {
      background: #d35400;
      color: white;
      font-weight: bold;
    }

    .content-panel {
      background: white;
      padding: 25px;
      border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05);
      border: 1px solid #eee;
    }

    /* Table Styles */
    .user-table {
      width: 100%;
      border-collapse: collapse;
    }
    .user-table th, .user-table td {
      padding: 12px;
      text-align: left;
      border-bottom: 1px solid #eee;
    }
    .badge {
      padding: 4px 8px;
      border-radius: 4px;
      background: #95a5a6;
      color: white;
      font-size: 0.8rem;
    }
    .badge.admin { background: #f1c40f; color: #000; }
    
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #e74c3c;
      margin-right: 5px;
    }
    .status-dot.active { background: #2ecc71; }

    .btn-toggle, .btn-role {
      padding: 5px 10px;
      border: 1px solid #ddd;
      border-radius: 5px;
      cursor: pointer;
      background: #f8f9fa;
      margin-right: 5px;
    }
    .btn-toggle.ban {
        border-color: #e74c3c;
        color: #e74c3c;
    }
    .btn-toggle.ban:hover { background: #fee; }

    .btn-role {
        border-color: #3498db;
        color: #2980b9;
        font-size: 0.8rem;
    }
    .btn-role.promote {
        color: #27ae60;
        border-color: #2ecc71;
    }
    .btn-role:hover { background: #eaf2f8; }
    
    .btn-delete {
      border: none;
      background: none;
      cursor: pointer;
      font-size: 1.2rem;
      margin-left: 10px;
    }

    /* Persona Editor & Training */
    .persona-editor textarea, .textarea-field {
      width: 100%;
      padding: 15px;
      border: 2px solid #000; /* High Contrast Border */
      border-radius: 8px;
      font-size: 1rem;
      font-family: monospace;
      color: #000 !important; /* Force Black Text */
      background: #f8f9fa !important; /* Ensure Light Grey Bg */
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    .input-field {
        width: 100%;
        padding: 10px;
        border: 2px solid #000; /* High Contrast Border */
        border-radius: 8px;
        color: #000 !important; /* Force Black Text */
        background: #f8f9fa !important; /* Ensure Light Grey Bg */
        margin-bottom: 10px;
        font-size: 1rem;
        box-sizing: border-box;
    }
    .hint { color: #888; font-size: 0.9rem; margin-top: 5px; }
    .btn-save {
      background: #27ae60;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 1rem;
    }
    .btn-save:disabled { opacity: 0.7; }
    
    .card {
        border: 1px solid #eee;
        padding: 15px;
        border-radius: 8px;
        background: #fafafa;
    }
    .status-msg {
        color: #27ae60;
        font-weight: bold;
        margin-top: 10px;
    }
  `]
})
export class AdminDashboardComponent implements OnInit {
  // ... (Props) ...
  activeTab = 'users';
  users: any[] = [];
  personaText = '';
  saving = false;
  trainTitle = '';
  trainText = '';
  uploadStatus = '';

  constructor(
    private adminService: AdminService,
    private http: HttpClient,
    private chatService: ChatService
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadPersona();
  }

  loadUsers() {
    this.adminService.getUsers().subscribe(data => this.users = data);
  }

  toggleUserStatus(user: any) {
    const newStatus = !user.is_active;
    this.adminService.updateUserStatus(user.id, { is_active: newStatus }).subscribe(() => {
      user.is_active = newStatus;
    });
  }

  toggleRole(user: any) {
    if (user.id === 1) return alert("Cannot change Super Admin!");

    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const verb = newRole === 'admin' ? 'Promote' : 'Demote';

    if (!confirm(`Are you sure you want to ${verb} ${user.nickname}?`)) return;

    this.adminService.updateUserStatus(user.id, { role: newRole }).subscribe({
      next: () => {
        user.role = newRole;
        alert(`User is now ${newRole}!`);
      },
      error: (err) => {
        console.error(err);
        alert("Failed to change role.");
      }
    });
  }

  deleteUser(user: any) {
    if (confirm(`Are you sure you want to delete ${user.username}?`)) {
      this.adminService.deleteUser(user.id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== user.id);
      });
    }
  }

  loadPersona() {
    this.http.get<{ persona: string }>('http://localhost:8000/persona').subscribe(res => {
      this.personaText = res.persona;
    });
  }

  savePersona() {
    this.saving = true;
    this.http.post('http://localhost:8000/persona', { persona_text: this.personaText }).subscribe({
      next: () => {
        this.saving = false;
        alert('Persona updated globally!');
      },
      error: () => this.saving = false
    });
  }

  onAdminFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      this.uploadStatus = `Uploading ${file.name} to Global Memory...`;
      this.chatService.uploadFile(file, 'global').subscribe({
        next: (res) => this.uploadStatus = `Success: ${res.filename} added to Global Memory!`,
        error: (err) => this.uploadStatus = `Error: ${err.message}`
      });
    }
  }

  adminTrainText() {
    if (!this.trainTitle || !this.trainText) return;
    this.chatService.trainText(this.trainTitle, this.trainText, 'global').subscribe({
      next: () => {
        alert('Global Memory Updated!');
        this.trainTitle = '';
        this.trainText = '';
      },
      error: (err) => alert('Error training global memory')
    });
  }
}
