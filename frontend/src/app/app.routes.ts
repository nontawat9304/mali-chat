import { Routes } from '@angular/router';
import { ChatComponent } from './components/chat/chat.component';
import { TrainingComponent } from './components/training/training';
import { GuideComponent } from './components/guide/guide';
import { AdminGuideComponent } from './components/admin-guide/admin-guide.component';

export const routes: Routes = [
    { path: '', redirectTo: 'chat', pathMatch: 'full' },
    { path: 'chat', component: ChatComponent },
    { path: 'training', component: TrainingComponent },
    { path: 'guide', component: GuideComponent },
    { path: 'admin-guide', component: AdminGuideComponent }
];
