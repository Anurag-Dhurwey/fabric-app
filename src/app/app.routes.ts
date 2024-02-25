import { Routes } from '@angular/router';
import { DashboardComponent } from './components/dashboard/dashboard.component';
import { CanvasComponent } from './components/canvas/canvas.component';

export const routes: Routes = [
  { path: 'dashboard', component: DashboardComponent },
  { path: 'canvas', component: CanvasComponent },
  { path: '', redirectTo:'dashboard',pathMatch:'full' },
];
