import { Component, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { DbService } from '../../services/db/db.service';
import { AuthService } from '../../services/auth/auth.service';
import { appState } from '../../store/reducers/state.reducer';
import { Store } from '@ngrx/store';
import { appSelector } from '../../store/selectors/app.selector';

@Component({
  selector: 'app-welcome',
  standalone: true,
  imports: [RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './welcome.component.html',
  styleUrl: './welcome.component.css',
})
export class WelcomeComponent {
  app$: appState | undefined;
  private store = inject(Store);

  constructor(
    public authService: AuthService,
    private router: Router,
    private dbService: DbService
  ) {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  async signOut() {
    try {
      await this.authService.signOutUser();
      this.router.navigate(['/sign-in']);
    } catch (error) {}
  }

  async createProject() {
    const id = await this.dbService.createProject();
    this.router.navigate([`/canvas/${id}`]);
  }
}
