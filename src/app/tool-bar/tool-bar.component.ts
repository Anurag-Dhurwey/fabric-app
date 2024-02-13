import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Actions } from '../../types/app.types';
import { Store } from '@ngrx/store';
import { appState } from '../store/reducers/state.reducer';
import { Observable } from 'rxjs';
import { appSelector } from '../store/selectors/app.selector';
import { setAction } from '../store/actions/state.action';
import { AsyncPipe, CommonModule } from '@angular/common';

@Component({
  selector: 'app-tool-bar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tool-bar.component.html',
  styleUrl: './tool-bar.component.css',
})
export class ToolBarComponent {
  @Output() toggleDrawingMode = new EventEmitter<boolean>();
  private store = inject(Store);
  app$: appState = {};
  constructor() {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }
  actions: Actions[] = [
    'select',
    'line',
    'circle',
    'rectangle',
    'pencil',
    'pen',
  ];
  onClickActionButton(action: Actions) {
    if (action === 'pencil') {
      this.toggleDrawingMode.emit();
      console.log("pencil")
    }
    this.store.dispatch(setAction({ action }));
  }
  // toggleDrawingMode(){

  // }
}
