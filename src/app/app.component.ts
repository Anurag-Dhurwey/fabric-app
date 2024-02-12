import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BoardComponent } from './board/board.component';
import { ToolBarComponent } from './tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { appSelector } from './store/selectors/app.selector';
import { appState } from './store/reducers/state.reducer';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, BoardComponent, ToolBarComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent {
  private store = inject(Store);
  app$: appState = {};
  constructor() {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }
}
