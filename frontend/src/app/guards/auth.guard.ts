import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
    providedIn: 'root'
})
export class AuthGuard implements CanActivate {
    constructor(private authService: AuthService, private router: Router) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const token = this.authService.getToken();
        if (token) {
            // Check for Admin Role if required
            if (route.data['role'] && route.data['role'] !== this.authService.currentUserValue?.role) {
                // Role mismatch (e.g. User trying to access Admin)
                this.router.navigate(['/chat']);
                return false;
            }
            return true;
        }

        // Not logged in
        this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
        return false;
    }
}
