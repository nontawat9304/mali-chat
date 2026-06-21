import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-container">
      <img [src]="(state === 'talking' ? '/chibi_talking.png' : '/chibi_idle.png') + '?t=' + timestamp" 
           [class.talking]="state === 'talking'"
           alt="Mali Chibi" 
           class="avatar-img">
    </div>
  `,
  styles: [`
    .avatar-container {
      display: flex;
      justify-content: center;
      align-items: flex-end; /* Sit on the bottom line of the header */
      height: 100%; 
      overflow: visible;
    }
    .avatar-img {
      max-height: 100%;
      transition: transform 0.2s;
      mix-blend-mode: multiply; /* Hides white background */
    }
    .talking {
      animation: talk-pulse 0.3s infinite alternate;
    }
    @keyframes talk-pulse {
      0% { transform: scale(1); }
      100% { transform: scale(1.02) translateY(-2px); }
    }
  `]
})
export class AvatarComponent {
  @Input() state: 'idle' | 'talking' = 'idle';
  timestamp = Date.now();
}
