import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const token = sessionStorage.getItem('access_token');
    const router = inject(Router); // Inject Router for redirect

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Check for Unauthorized (401) or Server Down (0) or 502/503/504
            if (error.status === 401 || error.status === 0 || error.status === 502 || error.status === 503 || error.status === 504) {
                if (error.status !== 401) {
                    alert("⚠️ Server Unavailable!\n\nการเชื่อมต่อเซิร์ฟเวอร์มีปัญหา หรือเซิร์ฟเวอร์ถูกปิด\nระบบจะทำการ Logout โดยอัตโนมัติ");
                } else {
                    // invoke notify user or explicit alert for session expired?
                    // alert("Session Expired. Please Login again."); 
                    // users find alerts annoying for 401, maybe just redirect.
                }

                // Force Logout Logic
                sessionStorage.clear();
                localStorage.clear();
                router.navigate(['/login']);
            }
            return throwError(() => error);
        })
    );
};
