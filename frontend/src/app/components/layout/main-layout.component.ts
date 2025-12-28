import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';

@Component({
    selector: 'app-main-layout',
    standalone: true,
    imports: [CommonModule, RouterOutlet, SidebarComponent],
    template: `
    <div class="app-container">
      <app-sidebar class="sidebar"></app-sidebar>
      <main class="content">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
    styles: [`
    .app-container {
      display: flex;
      height: 100vh;
      overflow: hidden;
    }
    .sidebar {
      width: 260px; /* Fixed width for sidebar */
      flex-shrink: 0;
      background: #202123;
      color: white;
    }
    .content {
      flex: 1;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
  `]
})
export class MainLayoutComponent { }
