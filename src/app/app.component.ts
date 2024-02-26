import { Component, OnInit, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToolBarComponent } from './components/tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { appSelector } from './store/selectors/app.selector';
import { appState } from './store/reducers/state.reducer';
import { setRole } from './store/actions/state.action';
import { Roles, Object, Presense } from '../types/app.types';
import { fabric } from 'fabric';
import { v4 as uuidv4 } from 'uuid';
import { SocketService } from './services/socket/socket.service';
import { CanvasService } from './services/canvas/canvas.service';
import { LayerPanelComponent } from './components/layer-panel/layer-panel.component';
import { PropertyPanelComponent } from './components/property-panel/property-panel.component';
import { AuthService } from './services/auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'fabric app';
  constructor(private router: Router, private authService: AuthService) {}

  ngOnInit(): void {
    this.authService.whenAuthStateChange((user) => {
      if (user) {
        this.router.navigate(['/dashboard']);
      } else {
        this.router.navigate(['/sign-in']);
      }
    });
  }
}
