import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="training-container">
      <header>
          <h1>📚 Teach Mali-chan</h1>
          <p class="subtitle">สอนน้องมะลิให้ฉลาดขึ้น (เฉพาะคุณเท่านั้น)</p>
      </header>

      <div class="tabs">
        <button (click)="setMode('file')" [class.active]="mode === 'file'">📂 Upload File</button>
        <button (click)="setMode('text')" [class.active]="mode === 'text'">✍️ Type Text</button>
        <button *ngIf="isAdmin" (click)="setMode('persona')" [class.active]="mode === 'persona'">🧠 Personality (Admin)</button>
        <button (click)="setMode('history')" [class.active]="mode === 'history'">📜 History</button>
      </div>

      <div class="content-panel">
          <!-- FILE UPLOAD MODE -->
          <div *ngIf="mode === 'file'">
            <h3>📄 Upload Knowledge File</h3>
            <p class="hint">เลือกไฟล์เอกสาร (.txt, .pdf, .docx, .md) เพื่อให้น้องมะลิจดจำ</p>
            
            <div class="form-group">
                <input type="file" (change)="onFileSelected($event)" #fileInput class="file-input">
            </div>
            
            <div *ngIf="selectedFile" class="preview-box">
                ✅ Selected: {{ selectedFile.name }}
            </div>
            
            <button (click)="uploadFile()" [disabled]="!selectedFile || isUploading" class="btn-save width-full">
              {{ isUploading ? 'Uploading...' : '🚀 Confirm Upload' }}
            </button>
          </div>

          <!-- TEXT INPUT MODE -->
          <div *ngIf="mode === 'text'">
            <h3>📝 Write Knowledge</h3>
            <p class="hint">พิมพ์สอนน้องมะลิโดยตรง (เช่น ข้อมูลส่วนตัว, กฎระเบียบ)</p>
            
            <input type="text" [(ngModel)]="textTitle" placeholder="Topic / Title (e.g. My Bio)" class="input-field">
            <textarea [(ngModel)]="textContent" placeholder="Content to be memorized..." rows="8" class="textarea-field"></textarea>
            
            <button (click)="submitText()" [disabled]="!textTitle || !textContent || isUploading" class="btn-save width-full">
              {{ isUploading ? 'Saving...' : '💾 Save Memory' }}
            </button>
          </div>

          <!-- PERSONA MODE -->
          <div *ngIf="mode === 'persona' && isAdmin">
            <h3>🎭 Custom Personality (Admin Only)</h3>
            <p class="hint">กำหนดนิสัยและวิธีการพูดของน้องมะลิ</p>
            <textarea [(ngModel)]="personaText" placeholder="Example: You are a cute assistant..." rows="12" class="textarea-field"></textarea>
            <button (click)="savePersona()" [disabled]="!personaText || isUploading" class="btn-save width-full">
              {{ isUploading ? 'Updating...' : '💾 Update Persona' }}
            </button>
          </div>
          
          <!-- HISTORY MODE -->
          <div *ngIf="mode === 'history'" class="history-section">
              <h3>📜 Training History ({{ filteredHistory.length }} Items)</h3>
              <p class="hint">รายการข้อมูลที่น้องมะลิจำได้ (สามารถแก้ไข ลบ หรือดาวน์โหลดได้)</p>
              
              <div class="card" style="margin-bottom: 20px;">
                  <input [(ngModel)]="searchText" (input)="filterHistory()" placeholder="🔍 Search memory..." class="input-field">
              </div>
              
              <ul class="history-list">
                  <li *ngFor="let item of paginatedHistory" class="history-item">
                      <div class="item-left">
                           <span class="history-icon" [title]="item.scope">{{ item.scope === 'global' ? '🌎' : '🔒' }}</span>
                          <div class="history-info">
                              <strong>{{ item.filename }}</strong>
                              <small>{{ item.timestamp | date:'short' }}</small>
                          </div>
                      </div>
                      <div class="item-actions">
                          <button class="btn-action edit" (click)="openEdit(item.filename)" title="Edit">✏️</button>
                          <button class="btn-action download" (click)="downloadFile(item.filename)" title="Download">⬇️</button>
                          <button class="btn-action delete" (click)="deleteTraining(item.filename)" title="Forget">🗑️</button>
                      </div>
                  </li>
                  <li *ngIf="filteredHistory.length === 0" class="empty-state">No matching memories found.</li>
              </ul>
              
              <!-- PAGINATION -->
              <div class="pagination" *ngIf="totalPages > 1">
                   <button (click)="changePage(-1)" [disabled]="currentPage === 1">◀ Prev</button>
                   <span>Page {{ currentPage }} of {{ totalPages }}</span>
                   <button (click)="changePage(1)" [disabled]="currentPage === totalPages">Next ▶</button>
              </div>
          </div>
      </div>
      
      <!-- EDIT MODAL -->
      <div *ngIf="isEditing" class="modal-overlay">
          <div class="modal">
              <h3>✏️ Editing: {{ editFilename }}</h3>
              <textarea [(ngModel)]="editContent" rows="15" class="textarea-field"></textarea>
              <div class="modal-actions">
                  <button (click)="saveEdit()" class="btn-save">💾 Save Changes</button>
                  <button (click)="cancelEdit()" class="btn-cancel">❌ Cancel</button>
              </div>
          </div>
      </div>
      
      <!-- REMOVED OLD HISTORY SECTION BELOW -->

    </div>
  `,
  styles: [`
    .training-container {
      max-width: 900px;
      margin: 0 auto;
      padding: 40px 20px;
      font-family: 'Inter', sans-serif;
      min-height: 100vh;
    }
    
    header { margin-bottom: 30px; text-align: center; }
    h1 { margin: 0; color: #d35400; font-size: 2rem; }
    .subtitle { color: #7f8c8d !important; font-size: 1rem; margin-top: 5px; }
    
    /* Tabs */
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; flex-wrap: wrap; }
    .tabs button {
      padding: 10px 20px; border: none; background: #eee; border-radius: 8px;
      cursor: pointer; font-size: 1rem; color: #7f7f7f; transition: all 0.2s;
    }
    .tabs button.active { background: #d35400; color: white; font-weight: bold; }
    
    /* Content Panel */
    .content-panel {
      background: white; padding: 30px; border-radius: 12px;
      box-shadow: 0 4px 15px rgba(0,0,0,0.05); border: 1px solid #eee; margin-bottom: 30px;
    }
    
    h3 { color: #2c3e50 !important; margin-top: 0; }
    .hint { color: #7f8c8d !important; font-size: 0.9rem; margin-bottom: 20px; }
    
    /* Inputs High Contrast */
    .input-field, .textarea-field {
      width: 100%; padding: 12px; border: 2px solid #2c3e50; border-radius: 8px;
      font-size: 1rem; color: #000 !important; background: #f8f9fa !important;
      margin-bottom: 15px; box-sizing: border-box; font-family: inherit;
    }
    
    .file-input { margin-bottom: 15px; }
    .preview-box {
        background: #e8f8f5; border: 1px solid #2ecc71; color: #27ae60;
        padding: 10px; border-radius: 8px; margin-bottom: 15px; text-align: center; font-weight: bold;
    }

    /* Buttons */
    .btn-save {
      background: #27ae60; color: white; border: none; padding: 12px;
      border-radius: 8px; cursor: pointer; font-size: 1.1rem; font-weight: bold;
      transition: background 0.2s;
    }
    .btn-save:hover { background: #219150; }
    .btn-save:disabled { opacity: 0.6; cursor: not-allowed; }
    .width-full { width: 100%; }

    /* History */
    .history-list { list-style: none; padding: 0; }
    .history-item {
        background: #f8f9fa; border: 1px solid #eee; padding: 15px; border-radius: 8px;
        margin-bottom: 10px; display: flex; align-items: center; justify-content: space-between;
    }
    .item-left { display: flex; align-items: center; }
    .history-icon { font-size: 1.5rem; margin-right: 15px; }
    .history-info strong { display: block; color: #2c3e50; font-size: 1rem; }
    .history-info small { color: #95a5a6; }
    
    .item-actions { display: flex; gap: 10px; }
    .btn-action {
        border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.9rem;
        display: flex; align-items: center; gap: 5px;
    }
    .btn-action.download { background: #3498db; color: white; }
    .btn-action.download:hover { background: #2980b9; }
    
    .btn-action.delete { background: #e74c3c; color: white; }
    .btn-action.delete:hover { background: #c0392b; }

    .empty-state { text-align: center; color: #999; padding: 20px; }
    
    .btn-action.edit { background: #f39c12; color: white; }
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
        background: rgba(0,0,0,0.5); display: flex; justify-content: center; align-items: center; z-index: 1000;
    }
    .modal {
        background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
    }
    .modal-actions { display: flex; gap: 10px; margin-top: 20px; justify-content: flex-end; }
    .btn-cancel { background: #e74c3c; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer; }

  `]
})
export class TrainingComponent implements OnInit {
  // ...
  selectedFile: File | null = null;
  textTitle = '';
  textContent = '';
  personaText = '';
  isUploading = false;
  uploadStatus = '';
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

  mode: 'file' | 'text' | 'persona' | 'history' = 'file';

  constructor(private chatService: ChatService, private authService: AuthService) { }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  ngOnInit() {
    this.loadHistory();
    // Only load persona if admin, to save bandwidth/security
    if (this.isAdmin) {
      this.loadPersona();
    }
  }


  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.uploadStatus = '';
  }

  setMode(m: 'file' | 'text' | 'persona' | 'history') {
    this.mode = m;
    this.uploadStatus = '';
  }

  uploadFile() {
    if (!this.selectedFile) return;
    this.executeTraining(this.chatService.uploadFile(this.selectedFile), 'taught');
  }

  submitText() {
    if (!this.textTitle.trim() || !this.textContent.trim()) return;
    this.executeTraining(this.chatService.trainText(this.textTitle, this.textContent), 'taught');
  }

  savePersona() {
    if (!this.personaText.trim()) return;
    this.executeTraining(this.chatService.updatePersona(this.personaText), 'updated persona');
  }

  deleteTraining(filename: string) {
    if (!confirm('Are you sure you want Mali-chan to forget this? \n(Indices will be rebuilt)')) return;

    this.isUploading = true;
    this.chatService.forgetTraining(filename).subscribe({
      next: () => {
        this.isUploading = false;
        this.loadHistory();
        alert('Deleted and memories rebuilt!');
      },
      error: (err) => {
        this.isUploading = false;
        console.error(err);
        alert('Failed to delete.');
      }
    });
  }

  downloadFile(filename: string) {
    this.chatService.downloadFile(filename);
  }

  executeTraining(observable: any, verb: string) {
    this.isUploading = true;
    observable.subscribe({
      next: (res: any) => {
        this.isUploading = false;
        this.uploadStatus = `✅ Successfully ${verb} Mali-chan!`;
        this.selectedFile = null;
        this.textTitle = '';
        this.textContent = '';
        this.loadHistory();
      },
      error: (err: any) => {
        this.isUploading = false;
        this.uploadStatus = '❌ Failed.';
        console.error(err);
      }
    });
  }

  loadHistory() {
    this.chatService.getHistory().subscribe(data => {
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
        this.loadHistory();
      },
      error: () => alert('Failed to save changes.')
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.editFilename = '';
    this.editContent = '';
  }

  loadPersona() {
    this.chatService.getPersona().subscribe(data => {
      this.personaText = data.persona;
    });
  }
}
