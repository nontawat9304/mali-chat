import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-container">
      <div class="glass-card">
        <div class="logo">
          <img src="chibi_idle.png" alt="Mali-Chan" class="logo-img">
          <h1>Mali-Chan</h1>
          <p>Your Friendly AI Assistant</p>
        </div>

        <div class="tabs">
          <button [class.active]="isLogin" (click)="isLogin = true">Login</button>
          <button [class.active]="!isLogin" (click)="isLogin = false">Register</button>
        </div>

        <form (ngSubmit)="onSubmit()">
          <!-- Nickname (Register Only) -->
          <div class="form-group" *ngIf="!isLogin">
            <label>Nickname (ชื่อเล่น/ชื่อที่ให้มะลิเรียก)</label>
            <input type="text" [(ngModel)]="nickname" name="nickname" placeholder="e.g. พี่ไอซ์">
          </div>

          <!-- Email -->
          <div class="form-group">
            <label>Email</label>
            <input type="email" [(ngModel)]="email" name="email" required placeholder="name@example.com">
          </div>
          
          <div class="form-group">
            <label>Password</label>
            <input type="password" [(ngModel)]="password" name="password" required placeholder="Enter password">
          </div>

          <div *ngIf="errorMessage" class="error-msg">
            {{ errorMessage }}
          </div>
          
          <div *ngIf="successMessage" class="success-msg">
            {{ successMessage }}
          </div>

          <button type="submit" class="auth-btn" [disabled]="loading">
            <span *ngIf="!loading">{{ isLogin ? 'Login' : 'Create Account' }}</span>
            <span *ngIf="loading" class="spinner">⏳</span>
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .auth-container {
      height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
      position: relative;
      overflow: hidden;
      font-family: 'Inter', sans-serif;
    }

    .glass-card {
      background: rgba(255, 255, 255, 0.85); /* Increased opacity for legibility */
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border-radius: 20px;
      border: 1px solid rgba(255, 255, 255, 0.3);
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.2);
      z-index: 10;
      text-align: center; /* Center align everything */
    }

    .logo {
      margin-bottom: 20px;
    }

    .logo-img {
        width: 100px;
        height: 100px;
        object-fit: contain;
        margin-bottom: 10px;
        border-radius: 50%;
        background: #fff;
        padding: 5px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    .logo h1 {
      margin: 0;
      color: #2c3e50;
      font-size: 2rem;
    }


    .logo p {
      margin: 5px 0 0;
      color: #7f8c8d;
      font-size: 0.9rem;
    }

    .tabs {
      display: flex;
      margin-bottom: 25px;
      background: rgba(0, 0, 0, 0.05);
      border-radius: 12px;
      padding: 4px;
    }

    .tabs button {
      flex: 1;
      border: none;
      background: transparent;
      padding: 10px;
      border-radius: 10px;
      cursor: pointer;
      font-weight: 600;
      color: #666;
      transition: all 0.3s;
    }

    .tabs button.active {
      background: #fff;
      color: #3498db;
      box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    }

    .form-group {
      margin-bottom: 20px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: #34495e;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .form-group input {
      width: 100%;
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 10px;
      font-size: 1rem;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }

    .form-group input:focus {
      outline: none;
      border-color: #3498db;
    }

    .auth-btn {
      width: 100%;
      padding: 12px;
      background: linear-gradient(135deg, #3498db 0%, #2980b9 100%);
      color: white;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .auth-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(52, 152, 219, 0.3);
    }

    .auth-btn:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }

    .error-msg {
      color: #e74c3c;
      font-size: 0.85rem;
      margin-bottom: 15px;
      text-align: center;
      background: rgba(231, 76, 60, 0.1);
      padding: 8px;
      border-radius: 6px;
    }
    
    .success-msg {
      color: #27ae60;
      font-size: 0.85rem;
      margin-bottom: 15px;
      text-align: center;
      background: rgba(39, 174, 96, 0.1);
      padding: 8px;
      border-radius: 6px;
    }


  `]
})
export class LoginComponent {
  email = '';
  password = '';
  nickname = '';
  isLogin = true;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService, private router: Router) {
    if (this.authService.getToken()) {
      this.router.navigate(['/chat']);
    } else {
      // Force clear old data (Legacy LocalStorage + any Session junk)
      localStorage.clear();
      sessionStorage.clear();
    }
  }

  onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    if (this.isLogin) {
      this.authService.login(this.email, this.password).subscribe({
        next: () => {
          this.router.navigate(['/chat']);
        },
        error: (err) => {
          this.errorMessage = err.error.detail || 'Login failed';
          this.loading = false;
        }
      });
    } else {
      // Register
      if (!this.email || !this.password) {
        this.errorMessage = "Please fill in all fields.";
        this.loading = false;
        return;
      }
      const nick = this.nickname.trim() || 'Boss'; // Default nickname
      this.authService.register(this.email, this.password, nick).subscribe({
        next: (res) => {
          this.successMessage = `Hello ${nick}! Account created. Please login.`;
          this.isLogin = true;
          this.loading = false;
        },
        error: (err) => {
          console.error(err);
          this.errorMessage = err.error.detail || 'Registration failed';
          this.loading = false;
        }
      });
    }
  }
}
