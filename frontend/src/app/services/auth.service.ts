import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { ChatService } from './chat.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8000'; // Base URL
    // In a real app, use environment variables

    private currentUserSubject = new BehaviorSubject<any>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    public get currentUserValue(): any {
        return this.currentUserSubject.value;
    }

    constructor(private http: HttpClient, private router: Router, private chatService: ChatService) {
        this.loadToken();
    }


    private loadToken() {
        const token = sessionStorage.getItem('access_token');
        const role = sessionStorage.getItem('user_role');
        const nickname = sessionStorage.getItem('user_nickname');
        if (token) {
            this.currentUserSubject.next({ nickname, role, token });
        }
    }

    register(email: string, password: string, nickname: string): Observable<any> {
        const payload = { email, password, nickname }; // Send as JSON, not FormData
        return this.http.post(`${this.apiUrl}/auth/register`, payload);
    }

    login(email: string, password: string): Observable<any> {
        const formData = new FormData();
        formData.append('username', email); // OAuth2 expects 'username' field, so we map email to it
        formData.append('password', password);

        return this.http.post(`${this.apiUrl}/auth/login`, formData).pipe(
            tap((res: any) => {
                if (res.access_token) {
                    sessionStorage.setItem('access_token', res.access_token);
                    sessionStorage.setItem('user_role', res.role);
                    sessionStorage.setItem('user_nickname', res.nickname);
                    this.currentUserSubject.next({ nickname: res.nickname, role: res.role, token: res.access_token });
                    // Note: using nickname for display instead of email/username
                }
            })
        );
    }
    logout() {
        sessionStorage.removeItem('access_token');
        sessionStorage.removeItem('user_role');
        sessionStorage.removeItem('user_nickname');
        sessionStorage.clear(); // Clear all session data
        this.chatService.clearMessages(); // Reset chat service state
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return sessionStorage.getItem('access_token');
    }

    isAdmin(): boolean {
        const user = this.currentUserSubject.value;
        return user && user.role === 'admin';
    }
}
