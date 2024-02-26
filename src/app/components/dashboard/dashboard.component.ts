import { Component, OnInit, inject } from '@angular/core';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth/auth.service';
import { DbService } from '../../services/db/db.service';
import { Object, Projects } from '../../../types/app.types';
import { appSelector } from '../../store/selectors/app.selector';
import { Store } from '@ngrx/store';
import { appState } from '../../store/reducers/state.reducer';
import { setProjects } from '../../store/actions/state.action';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  // projects: Projects[] = [];
  app$: appState | undefined;
  private store = inject(Store);
  constructor(
    private authService: AuthService,
    private router: Router,
    private dbService: DbService
  ) {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  // folders: (folder | file)[] = [
  //   { type: 'file', data: '123' },
  //   { type: 'file', data: '123' },
  //   { type: 'file', data: '123' },
  //   {
  //     type: 'folder',
  //     data: [
  //       { type: 'file', data: '123' },
  //       { type: 'file', data: '123' },
  //       { type: 'folder', data: [{ type: 'file', data: '123' }] },
  //     ],
  //   },
  // ];

  async ngOnInit() {
    if (!this.app$?.projects.length) {
      const projects = await this.dbService.getProjects();
      projects &&
        this.store.dispatch(
          setProjects({ project: projects, method: 'reset' })
        );
    }
  }

  signUp() {
    this.authService.signUp();
  }
  signIn() {
    this.authService.signIn();
  }
  signOut() {
    this.authService.signOutUser();
  }

  async createProject() {
    const id = await this.dbService.createProject();
    this.router.navigate([`/canvas/${id}`]);
  }
}

type file = { type: 'file'; data: any };
type folder = { type: 'folder'; data: (file | folder)[] };
