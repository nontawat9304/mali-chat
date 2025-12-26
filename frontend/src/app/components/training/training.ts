import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="training-container">
      <h2>📚 Teach Mali-chan</h2>
      
      <div class="upload-card">
        <div class="tabs">
          <button (click)="setMode('file')" [class.active]="mode === 'file'">📂 Upload File</button>
          <button (click)="setMode('text')" [class.active]="mode === 'text'">✍️ Type Text</button>
          <button (click)="setMode('persona')" [class.active]="mode === 'persona'">🧠 Personality</button>
        </div>

        <!-- FILE UPLOAD MODE -->
        <div *ngIf="mode === 'file'" class="tab-content">
          <h3>Upload Knowledge</h3>
          <p>Select a text file to teach Mali-chan new things.</p>
          <input type="file" (change)="onFileSelected($event)" #fileInput>
          <div *ngIf="selectedFile" class="preview">📄 {{ selectedFile.name }}</div>
          <button (click)="uploadFile()" [disabled]="!selectedFile || isUploading" class="upload-btn">
            {{ isUploading ? 'Uploading...' : 'Confirm Upload' }}
          </button>
        </div>

        <!-- TEXT INPUT MODE -->
        <div *ngIf="mode === 'text'" class="tab-content">
          <h3>Write Knowledge</h3>
          <p>Type or paste information directly.</p>
          <input type="text" [(ngModel)]="textTitle" placeholder="Title / Topic (e.g. My Bio)" class="text-input">
          <textarea [(ngModel)]="textContent" placeholder="Enter content here..." rows="6" class="text-area"></textarea>
          <button (click)="submitText()" [disabled]="!textTitle || !textContent || isUploading" class="upload-btn">
            {{ isUploading ? 'Saving...' : 'Confirm Save' }}
          </button>
        </div>

        <!-- PERSONA MODE -->
        <div *ngIf="mode === 'persona'" class="tab-content">
          <h3>🧠 Custom Persona</h3>
          <p>Define who Mali-chan is and how she speaks.</p>
          <textarea [(ngModel)]="personaText" placeholder="Example: You are a cute assistant who ends sentences with 'meow'..." rows="6" class="text-area"></textarea>
          <button (click)="savePersona()" [disabled]="!personaText || isUploading" class="upload-btn persona-btn">
            {{ isUploading ? 'Updating...' : 'Update Persona' }}
          </button>
        </div>
        
        <p *ngIf="uploadStatus" class="status-msg">{{ uploadStatus }}</p>
      </div>

      <div class="history-card">
        <h3>📖 Training History</h3>
        <table>
          <thead>
            <tr>
              <th>Topic / File</th>
              <th>Date</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of history">
              <td>{{ item.filename }}</td>
              <td>{{ item.timestamp | date:'short' }}</td>
              <td><span class="tag success">{{ item.status }}</span></td>
               <td>
                <button (click)="downloadFile(item.filename)" class="download-btn">⬇️ Download</button>
                <button class="delete-btn" (click)="deleteTraining(item.filename)">🗑️ Forget</button>
              </td>
            </tr>
            <tr *ngIf="history.length === 0">
              <td colspan="4" style="text-align: center;">No history yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .training-container { padding: 30px; max-width: 800px; margin: 0 auto; overflow-y: auto; height: 100vh; }
    h2 { color: #2c3e50; margin-bottom: 20px; }
    .upload-card, .history-card {
      background: white; padding: 25px; border-radius: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.05); margin-bottom: 20px;
    }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; border-bottom: 2px solid #eee; padding-bottom: 10px; }
    .tabs button {
      background: none; border: none; font-size: 1rem; color: #7f8c8d; cursor: pointer; padding: 8px 15px; border-radius: 8px;
    }
    .tabs button.active { background: #3498db; color: white; font-weight: bold; }
    
    .text-input, .text-area {
      width: 100%; padding: 10px; border: 1px solid #ccc; border-radius: 8px; margin-bottom: 10px; font-family: inherit;
    }
    .text-area { resize: vertical; }

    .upload-btn {
      background: #e74c3c; color: white; border: none; padding: 10px 20px;
      border-radius: 8px; cursor: pointer; font-size: 1rem; margin-top: 15px;
    }
    .persona-btn { background: #8e44ad; }
    .upload-btn:disabled { background: #e0e0e0; cursor: not-allowed; }
    
    .delete-btn, .download-btn {
      background: #c0392b; color: white; border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; font-size: 0.8rem;
      margin-left: 5px; /* Add some spacing between buttons */
    }
    .delete-btn:hover { background: #e74c3c; }
    .download-btn {
      background: #2980b9; /* Peter River Blue */
    }
    .download-btn:hover {
      background: #3498db; /* Brighter blue on hover */
    }

    .preview { margin-top: 10px; font-weight: bold; color: #34495e; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th, td { padding: 12px; text-align: left; border-bottom: 1px solid #eee; }
    th { color: #7f8c8d; font-weight: 600; }
    .tag { padding: 4px 8px; border-radius: 4px; font-size: 0.8rem; }
    .tag.success { background: #d5f5e3; color: #2ecc71; }
  `]
})
export class TrainingComponent implements OnInit {
  selectedFile: File | null = null;
  textTitle = '';
  textContent = '';
  personaText = '';
  isUploading = false;
  uploadStatus = '';
  history: any[] = [];
  mode: 'file' | 'text' | 'persona' = 'file';

  constructor(private chatService: ChatService) { }

  ngOnInit() {
    this.loadHistory();
    this.loadPersona();
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    this.uploadStatus = '';
  }

  setMode(m: 'file' | 'text' | 'persona') {
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
    });
  }

  loadPersona() {
    this.chatService.getPersona().subscribe(data => {
      this.personaText = data.persona;
    });
  }
}
