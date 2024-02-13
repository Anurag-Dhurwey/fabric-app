import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolBarComponent } from './tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { appSelector } from './store/selectors/app.selector';
import { appState } from './store/reducers/state.reducer';
import { setAction } from './store/actions/state.action';
import { Actions } from '../types/app.types';
import { fabric } from 'fabric';
import { Observable, Subscriber, Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToolBarComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'fabric app';
  app$: appState = {};
  objects: any[] = [];
  objectsObserver: Subscriber<any> | undefined;
  canvas: fabric.Canvas | null = null;

  private store = inject(Store);
  constructor() {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  ngOnInit(): void {
    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = window.innerWidth;
    board.height = window.innerHeight;

    this.canvas = new fabric.Canvas(board);
    this.canvas.on('mouse:down', (event) => this.onMouseDown(event));
    this.canvas.on('mouse:move', (event) => this.onMouseMove(event));
    this.canvas.on('mouse:up', (event) => this.onMouseUp(event));
    new Observable((observer) => {
      this.objectsObserver = observer;
    })?.subscribe((newData) => {
      this.executeFunctionOnDataChange(); // Call your function
    });
  }
  executeFunctionOnDataChange() {
    console.log('Data changed:', this.objects);
  }

  // @HostListener('click', ['$event'])
  // onClick(e: any) {
  //   this.updateObjects({ hello: 'name' });
  //   console.log('clicl');
  // }
  updateObjects(data: any) {
    this.objects.push(data);
    this.objectsObserver?.next();
  }
  onMouseDown(event: fabric.IEvent<MouseEvent>): void {
    if (this.app$?.action && this.app$.action != 'select') {
      const obj = this.createObjects(event, this.app$.action);
      obj && this?.canvas?.add(obj);
    }
  }

  onMouseMove(event: fabric.IEvent<MouseEvent>): void {}

  onMouseUp(event: fabric.IEvent<MouseEvent>): void {
    this.store.dispatch(setAction({ action: 'select' }));
    if (this.canvas?.isDrawingMode) {
      this.canvas.isDrawingMode = false;
    }
  }

  createObjects(e: fabric.IEvent<MouseEvent>, action: Actions) {
    if (!e.pointer) return;
    const { x, y } = e.pointer;
    if (action === 'line') {
      return new fabric.Line([x, y, x + 300, y + 300], {
        stroke: 'gray',
        strokeWidth: 5,
      });
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
    } else if (action === 'pen') {
      const startPoint = new fabric.Point(100, 100);
      const endPoint = new fabric.Point(300, 100);
      const controlPoint = new fabric.Point(200, 50);

      // Create quadratic curve object
      const quadraticCurve = new fabric.Path(
        `M ${startPoint.x} ${startPoint.y} Q ${controlPoint.x} ${controlPoint.y} ${endPoint.x} ${endPoint.y}`
      );
      quadraticCurve.set({ fill: '', stroke: 'red', strokeWidth: 2 });
      return quadraticCurve;
      // Add quadratic curve to canvas
      // this.canvas.add(quadraticCurve);
    } else {
      return;
    }
  }
  togleDrawingMode(toggle?: boolean) {
    console.log('upp');
    if (!this.canvas) return;
    this.canvas.isDrawingMode =
      toggle === undefined ? !this.canvas?.isDrawingMode : toggle;
  }
}
