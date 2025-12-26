import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <div class="sidebar">
      <div class="logo">
        <img src="avatar_idle.png" alt="Mali-chan" class="logo-img">
        <h3>Mali-chan</h3>
      </div>
      <nav>
        <a routerLink="/chat" routerLinkActive="active" class="nav-item">💬 Chat</a>
        <a routerLink="/training" routerLinkActive="active" class="nav-item">📚 Training</a>
        <a routerLink="/guide" routerLinkActive="active" class="nav-item">📘 Guide</a>
      </nav>
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
      padding: 20px;
      box-shadow: 2px 0 5px rgba(0,0,0,0.1);
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
    }
    .nav-item:hover, .nav-item.active {
      background: #e74c3c;
      color: white;
    }
  `]
})
export class SidebarComponent { }
