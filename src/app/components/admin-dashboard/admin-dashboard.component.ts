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
    <div class="admin-wrapper">
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
                        class="btn-action delete" 
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
          
          <div class="card" style="margin-bottom: 20px;">
              <h4>Search & Filter</h4>
              <input [(ngModel)]="searchText" (input)="filterHistory()" placeholder="🔍 Search filenames..." class="input-field">
          </div>
          
          <div class="history-section">
               <h4>Global History ({{ filteredHistory.length }} Items)</h4>
               
               <table class="user-table">
                   <thead>
                       <tr>
                            <th>Filename</th>
                            <th>Scope</th>
                            <th>Date</th>
                           <th>Actions</th>
                       </tr>
                   </thead>
                   <tbody>
                       <tr *ngFor="let item of paginatedHistory">
                            <td>{{ item.filename }}</td>
                            <td>
                                <span class="badge" [class.admin]="item.scope === 'Global' || item.scope === 'global'">
                                    {{ item.scope || 'Private' }}
                                </span>
                            </td>
                            <td>{{ item.timestamp | date:'short' }}</td>
                            <td>
                                <div style="display: flex; gap: 5px; white-space: nowrap;">
                                    <button class="btn-action edit" (click)="openEdit(item.filename)">✏️ Edit</button>
                                    <button class="btn-action download" (click)="downloadFile(item.filename)">⬇️</button>
                                    <button class="btn-action delete" (click)="deleteTraining(item.filename)">🗑️</button>
                                </div>
                            </td>
                       </tr>
                   </tbody>
               </table>
               
               <!-- PAGINATION -->
               <div class="pagination" *ngIf="totalPages > 1">
                   <button (click)="changePage(-1)" [disabled]="currentPage === 1">◀ Prev</button>
                   <span>Page {{ currentPage }} of {{ totalPages }}</span>
                   <button (click)="changePage(1)" [disabled]="currentPage === totalPages">Next ▶</button>
               </div>
          </div>

          <div class="card" style="margin-top: 30px;">
              <h4>📄 Upload Knowledge File</h4>
              <!-- Improved File Upload UI -->
              <input type="file" (change)="onAdminFileSelected($event)" #adminFileInput style="display: none">
              <div style="display: flex; gap: 10px; align-items: center;">
                   <button (click)="adminFileInput.click()" class="btn-save" style="background: #34495e;">
                       📎 Choose File
                   </button>
                   <span *ngIf="uploadStatus" class="status-msg">{{ uploadStatus }}</span>
              </div>
          </div>
          
          <div class="card" style="margin-top: 20px;">
               <h4>📝 Direct Text Training</h4>
               <input [(ngModel)]="trainTitle" placeholder="Title (e.g. Company Policy)" class="input-field">
               <textarea [(ngModel)]="trainText" rows="5" placeholder="Content to be memorized globally..." class="textarea-field"></textarea>
               <button (click)="adminTrainText()" class="btn-save" style="margin-top: 10px;">Train Global Memory</button>
          </div>
      </div>
    
      <!-- EDIT MODAL -->
      <div *ngIf="isEditing" class="modal-overlay">
          <div class="modal">
              <h3>✏️ Editing: {{ editFilename }}</h3>
              <textarea [(ngModel)]="editContent" rows="20" class="textarea-field"></textarea>
              <div class="modal-actions">
                  <button (click)="saveEdit()" class="btn-save">💾 Save Changes</button>
                  <button (click)="cancelEdit()" class="btn-cancel">❌ Cancel</button>
              </div>
          </div>
      </div>

      <!-- GUIDE TAB -->
      <div *ngIf="activeTab === 'guide'" class="content-panel">
        <app-admin-guide></app-admin-guide>
      </div>

     </div>
    </div>
  `,
  styles: [`
    .admin-wrapper {
      width: 100%;
      height: 100vh;
      overflow-y: auto;
      background: #f5f7fa;
    }
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
      box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
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
    
    .btn-action { margin-right: 5px; padding: 5px 8px; border: none; border-radius: 4px; cursor: pointer; color: white; display: flex; align-items: center; justify-content: center; min-width: 32px; }
    .btn-action.edit { background: #f39c12; }
    .btn-action.download { background: #3498db; }
    .btn-action.delete { background: #e74c3c; } 
    .btn-action.delete:hover { background: #c0392b; }
    
    /* Specific Red Background for Delete Button as requested */
    .btn-delete {
      border: none;
      background: #e74c3c; /* Red Background */
      color: white; /* White Text */
      cursor: pointer;
      font-size: 1.2rem;
      margin-left: 10px;
      padding: 5px 10px;
      border-radius: 5px;
    }
    .btn-delete:hover {
      background: #c0392b;
    }

    /* Persona Editor & Training */
    .persona-editor textarea, .textarea-field {
      width: 100%;
      padding: 15px;
      border: 2px solid #000; /* High Contrast Border */
      border-radius: 8px;
      font-size: 1rem;
      font-family: monospace;
      color: #000!important; /* Force Black Text */
      background: #f8f9fa!important; /* Ensure Light Grey Bg */
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    .input-field {
      width: 100%;
      padding: 10px;
      border: 2px solid #000; /* High Contrast Border */
      border-radius: 8px;
      color: #000!important; /* Force Black Text */
      background: #f8f9fa!important; /* Ensure Light Grey Bg */
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
    
    .pagination {
      display: flex; justify-content: center; align-items: center; gap: 15px; margin-top: 20px;
    }
    .pagination button {
      padding: 5px 15px; background: #eee; border: none; border-radius: 5px; cursor: pointer;
    }
    .pagination button:disabled { opacity: 0.5; cursor: not-allowed; }

    /* MODAL */
    .modal-overlay {
      position: fixed; top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;
    }
    .modal {
      background: white; padding: 30px; border-radius: 12px; width: 80%; max-width: 800px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
    .btn-cancel { background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }
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

  // History & Pagination & Editing
  history: any[] = [];
  filteredHistory: any[] = [];
  paginatedHistory: any[] = [];
  searchText = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalPages = 1;

  isEditing = false;
  editFilename = '';
  editContent = '';

  constructor(
    private adminService: AdminService,
    private http: HttpClient,
    private chatService: ChatService
  ) { }

  ngOnInit() {
    this.loadUsers();
    this.loadPersona();
    this.loadHistory();
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
        alert(`User is now ${newRole} !`);
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
    this.http.get<{ persona: string }>('http://localhost:8002/persona').subscribe(res => {
      this.personaText = res.persona;
    });
  }

  savePersona() {
    this.saving = true;
    this.http.post('http://localhost:8002/persona', { persona_text: this.personaText }).subscribe({
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
        error: (err) => this.uploadStatus = `Error: ${err.message} `
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
        this.loadHistory();
      },
      error: (err) => alert('Error training global memory')
    });
  }

  // --- HISTORY & EDIT LOGIC ---
  loadHistory() {
    this.chatService.getHistory().subscribe(data => {
      // Show ALL history for Admin (Global + Private)
      this.history = data.reverse();
      this.filterHistory();
    });
  }

  filterHistory() {
    if (!this.searchText) {
      this.filteredHistory = this.history;
    } else {
      const lower = this.searchText.toLowerCase();
      this.filteredHistory = this.history.filter(h => h.filename.toLowerCase().includes(lower));
    }
    this.totalPages = Math.ceil(this.filteredHistory.length / this.itemsPerPage);
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedHistory = this.filteredHistory.slice(start, start + this.itemsPerPage);
  }

  changePage(delta: number) {
    this.currentPage += delta;
    this.updatePagination();
  }

  downloadFile(filename: string) {
    this.chatService.downloadFile(filename);
  }

  deleteTraining(filename: string) {
    if (!confirm('Are you sure you want to delete this global knowledge?')) return;
    this.chatService.forgetTraining(filename).subscribe(() => {
      this.loadHistory();
      alert('Deleted.');
    });
  }

  openEdit(filename: string) {
    this.chatService.getFileContent(filename).subscribe({
      next: (res) => {
        this.editFilename = filename;
        this.editContent = res.content;
        this.isEditing = true;
      },
      error: () => alert('Failed to load file content.')
    });
  }

  saveEdit() {
    if (!this.editContent) return;
    this.chatService.editFile(this.editFilename, this.editContent).subscribe({
      next: () => {
        this.isEditing = false;
        alert('File updated successfully!');
        this.loadHistory(); // Reload to update timestamp if needed (though backend might not update timestamp logic yet)
      },
      error: () => alert('Failed to save changes.')
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editFilename = '';
    this.editContent = '';
  }
}
