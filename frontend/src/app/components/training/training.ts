import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../services/chat.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './training.html',
  styleUrls: ['./training.css']
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

  scope: 'private' | 'global' = 'private'; // Default to private

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
    console.log('File selected event triggered', event);
    if (event.target.files && event.target.files.length > 0) {
      this.selectedFile = event.target.files[0];
      console.log('File captured:', this.selectedFile);
      this.uploadStatus = '';
    } else {
      console.warn('No file selected or user cancelled');
      this.selectedFile = null;
    }
  }

  setMode(m: 'file' | 'text' | 'persona' | 'history') {
    this.mode = m;
    this.uploadStatus = '';
  }

  uploadFile() {
    if (!this.selectedFile) return;
    this.executeTraining(this.chatService.uploadFile(this.selectedFile, 'private'), 'taught');
  }

  submitText() {
    if (!this.textTitle.trim() || !this.textContent.trim()) return;
    this.executeTraining(this.chatService.trainText(this.textTitle, this.textContent, 'private'), 'taught');
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
