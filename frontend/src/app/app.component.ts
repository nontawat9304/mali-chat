import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from './components/sidebar/sidebar';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, SidebarComponent],
    template: `
    <div class="app-container">
      <app-sidebar></app-sidebar>
      <div class="content">
        <router-outlet></router-outlet>
      </div>
    </div>
  `,
    styles: [`
    .app-container { display: flex; height: 100vh; width: 100vw; overflow: hidden; }
    .content { flex: 1; overflow-y: auto; background: #f5f7fa; }
  `]
})
export class AppComponent {
    title = 'ai-assistant';
}
