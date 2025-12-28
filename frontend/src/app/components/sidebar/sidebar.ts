import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar">
      <div class="top-section">
        <div class="logo">
            <img src="avatar_idle.png" alt="Mali-chan" class="logo-img">
            <h3>Mali-chan</h3>
        </div>
        <nav>
            <a routerLink="/chat" routerLinkActive="active" class="nav-item">💬 Chat</a>
            <a routerLink="/training" routerLinkActive="active" class="nav-item">📚 Training</a>
            <a routerLink="/guide" routerLinkActive="active" class="nav-item">📘 Guide</a>
            <a *ngIf="isAdmin" routerLink="/admin" routerLinkActive="active" class="nav-item admin-link">👑 Admin</a>
        </nav>
      </div>

      <div class="bottom-section">
        <button (click)="logout()" class="nav-item logout-btn">↪️ Logout</button>
      </div>
    </div>
  `,
  styles: [`
    .sidebar {
      width: 250px;
      height: 100vh;
      background: #2c3e50;
      color: white;
      display: flex;
      flex-direction: column;
      justify-content: space-between; /* Push bottom-section to bottom */
      padding: 20px;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1);
    }
    .top-section {
      display: flex;
      flex-direction: column;
    }
    .logo {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 30px;
      padding-bottom: 20px;
      border-bottom: 1px solid #34495e;
    }
    .logo-img {
      width: 50px;
      height: 50px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid #e74c3c;
    }
    h3 { margin: 0; font-size: 1.2rem; }
    nav {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .nav-item {
      padding: 12px 15px;
      color: #ecf0f1;
      text-decoration: none;
      border-radius: 8px;
      transition: background 0.3s;
      font-size: 1.1rem;
      display: block;
      cursor: pointer;
      text-align: left;
      border: none;
      background: none;
      width: 100%;
    }
    .nav-item:hover, .nav-item.active {
      background: #e74c3c;
      color: white;
    }
    .admin-link {
        color: #f1c40f;
    }
    .bottom-section {
        border-top: 1px solid #34495e;
        padding-top: 15px;
    }
    .logout-btn {
        background-color: #e74c3c;
        color: white;
        border-radius: 8px;
        text-align: center;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        gap: 8px;
        font-weight: bold;
        transition: all 0.2s;
    }
    .logout-btn:hover {
        background-color: #c0392b;
        color: white;
        transform: translateY(-2px);
    }
  `]
})
export class SidebarComponent {
  constructor(private authService: AuthService) { }

  get isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  logout() {
    this.authService.logout();
  }
}

