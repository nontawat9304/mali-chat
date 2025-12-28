import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { TrainingComponent } from './components/training/training';
import { GuideComponent } from './components/guide/guide';
import { AdminGuideComponent } from './components/admin-guide/admin-guide.component';
import { LoginComponent } from './components/login/login.component';
import { AdminDashboardComponent } from './components/admin-dashboard/admin-dashboard.component';
import { AuthGuard } from './guards/auth.guard';
import { MainLayoutComponent } from './components/layout/main-layout.component';

export const routes: Routes = [
    // Public Route (No Sidebar)
    { path: 'login', component: LoginComponent },

    // Protected Routes (With Sidebar)
    {
        path: '',
        component: MainLayoutComponent,
        canActivate: [AuthGuard],
        children: [
            { path: '', redirectTo: 'chat', pathMatch: 'full' },
            { path: 'chat', component: ChatComponent },
            { path: 'training', component: TrainingComponent },
            { path: 'guide', component: GuideComponent },
            { path: 'admin-guide', component: AdminGuideComponent },
            { path: 'admin', component: AdminDashboardComponent, data: { role: 'admin' } }
        ]
    }
];
