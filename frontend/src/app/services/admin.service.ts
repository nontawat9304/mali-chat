import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl = 'http://localhost:8000/admin';

    constructor(private http: HttpClient) { }

    getUsers(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/users`);
    }

    updateUserStatus(userId: number, payload: { is_active?: boolean, role?: string }): Observable<any> {
        return this.http.put(`${this.apiUrl}/users/${userId}`, payload);
    }

    deleteUser(userId: number): Observable<any> {
        return this.http.delete(`${this.apiUrl}/users/${userId}`);
    }

    // Persona Management (Reusing existing endpoints via Admin specialized calls if needed, 
    // but existing /persona is public? No, we need to protect it.
    // We will simply use the existing /persona endpoint which we will update to be protected in backend,
    // or we can add a specific method here.
    // For now let's assume /persona is what we use.
}
