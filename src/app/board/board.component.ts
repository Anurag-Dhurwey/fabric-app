import { Component, OnInit, inject } from '@angular/core';
import { fabric } from 'fabric';
import { Actions } from '../../types/app.types';
import { ToolBarComponent } from '../tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { appState } from '../store/reducers/state.reducer';
import { appSelector } from '../store/selectors/app.selector';
import { AsyncPipe } from '@angular/common';
import { setAction } from '../store/actions/state.action';

@Component({
  selector: 'app-board',
  standalone: true,
  imports: [ToolBarComponent, AsyncPipe],
  templateUrl: './board.component.html',
  styleUrl: './board.component.css',
})
export class BoardComponent implements OnInit {
  private store = inject(Store);
  app$: appState | null = null;
  constructor() {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  ngOnInit(): void {
    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    // Initialize Fabric.js
    const canvas = new fabric.Canvas(board);

    // Add Fabric.js code here to work with the canvas
    // For example, you can add shapes, text, images, etc.

    canvas.on('object:modified', (e) => {});

    canvas.on('mouse:down', (e) => {
      if (this.app$?.action && this.app$.action != 'select') {
        const obj = this.createObjects(e, this.app$.action);
        obj && canvas.add(obj);
      }
    });
    canvas.on('mouse:up', (e) => {
      this.store.dispatch(setAction({ action: 'select' }));
    });
  }

  createObjects(e: fabric.IEvent<MouseEvent>, action: Actions) {
    if (action === 'line') {
      // return new fabric.Line({
      //   top: e.pointer?.y,
      //   left: e.pointer?.x,
      //   fill: 'red',
      //   width: 200,
      //   height: 100,
      // })
      return;
    } else if (action === 'rectangle') {
      return new fabric.Rect({
        top: e.pointer?.y,
        left: e.pointer?.x,
        fill: 'red',
        width: 200,
        height: 100,
      });
    } else if (action === 'circle') {
      return new fabric.Circle({
        top: e.pointer?.y,
        left: e.pointer?.x,
        originX: 'center',
        originY: 'center',
        radius: 100,
        stroke: 'gray',
        fill: '',
      });
    } else {
      return;
    }
  }
}
