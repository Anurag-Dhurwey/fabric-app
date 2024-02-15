import { Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolBarComponent } from './tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { AsyncPipe } from '@angular/common';
import { appSelector } from './store/selectors/app.selector';
import { appState } from './store/reducers/state.reducer';
import { setAction, setPenToolStep } from './store/actions/state.action';
import { Actions, Object } from '../types/app.types';
import { fabric } from 'fabric';
import { Observable, Subscriber } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToolBarComponent, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'fabric app';
  app$: appState | undefined;
  objects: Object[] = [];
  objectsObserver: Subscriber<'objects' | 'action'> | undefined;
  tempRefObj: fabric.Line | undefined;
  isDrawing: boolean = false;
  // currentObject:fabric.Object|undefined
  currentDrawingObject: Object | undefined;
  canvas: fabric.Canvas | undefined;
  isPathControlPointMoving: boolean = false;
  // isCurrentDrawingPathClosed=false
  private store = inject(Store);
  constructor() {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  ngOnInit(): void {
    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = window.innerWidth;
    board.height = window.innerHeight;

    this.canvas = new fabric.Canvas(board);

    // this.canvas.on('mouse:over', (event) => console.log(event));
    this.canvas.on('mouse:down', (event) => this.onMouseDown(event));
    this.canvas.on('mouse:move', (event) => this.onMouseMove(event));
    this.canvas.on('mouse:up', (event) => this.onMouseUp(event));
    this.canvas.on('path:created', (event) =>
      this.onPathCreated(event as unknown as { path: fabric.Path })
    );
    this.canvas.on('object:moving', (event) => {
      // console.log(event.target);
    });
    new Observable((observer) => {
      this.objectsObserver = observer;
    })?.subscribe((arg) => {
      if ('objects') {
        this.renderObjectsOnCanvas();
      } else if ('action') {
      }
    });
  }
  renderObjectsOnCanvas() {
    this.canvas?.clear();
    this.objects.forEach((obj) => {
      this.canvas?.add(obj);
    });
  }

  // this updateObjects takes to arguments object and method
  // method could be 0 or 1
  // if 0 then object will replace last element of this.objects
  // if 1 then object will be pushed to this.objects
  updateObjects(objects: Object, method: 0 | 1 = 1) {
    if (method === 1) {
      this.objects.push(objects);
    } else if (method === 0) {
      this.objects[this.objects.length - 1] = objects;
    }
    this.objectsObserver?.next('objects');
  }

  onMouseDown(event: fabric.IEvent<MouseEvent>): void {
    if (!this.canvas) return;
    if (
      this.app$?.action &&
      this.app$.action != 'select' &&
      this.app$.action != 'pen'
    ) {
      this.isDrawing = true;
      const obj = this.createObjects(event, this.app$.action);
      if (obj) {
        obj._id = uuidv4();
        this.currentDrawingObject = obj;
        this.updateObjects(obj);
      }
    } else if (this.app$?.action === 'pen') {
      this.isPathControlPointMoving = true;
      this.isDrawing = true;
      if (this.currentDrawingObject) {
        const pen = this.currentDrawingObject as unknown as fabric.Path;
        if (!pen.path) return;
        const toEdit = pen.path as unknown as (number | string)[][];
        toEdit.push([
          'Q',
          event.pointer!.x,
          event.pointer!.y,
          event.pointer!.x,
          event.pointer!.y,
        ]);
        this.updateObjects(this.currentDrawingObject, 0);
        // this.store.dispatch(
        //   setPenToolStep({ penToolStep: this.app$.penToolStep + 1 })
        // );
      } else {
        const obj = this.createObjects(event, this.app$.action);
        if (obj) {
          obj._id = uuidv4();
          this.currentDrawingObject = obj;
          this.updateObjects(obj);
        }
      }
    }
  }

  onMouseMove(event: fabric.IEvent<MouseEvent>): void {
    const obj = this.objects[this.objects.length - 1];
    if (!obj) return;
    if (
      this.isDrawing &&
      event.pointer &&
      this.app$?.action &&
      this.app$.action != 'select' &&
      this.app$.action != 'pencil'
    ) {
      switch (this.app$.action) {
        case 'line':
          const line = obj as unknown as fabric.Line;
          line.set({ x2: event.pointer.x, y2: event.pointer.y });
          break;
        case 'rectangle':
          const rect = obj as fabric.Rect;
          rect.set({
            width: Math.abs(event.pointer.x - rect.left!),
            height: Math.abs(event.pointer.y - rect.top!),
          });
          break;
        case 'circle':
          const circle = obj as unknown as fabric.Circle;
          circle.set({
            radius: Math.floor(
              Math.abs(
                Math.sqrt(
                  (event.pointer.x - circle.left!) ** 2 +
                    (event.pointer.y - circle.top!) ** 2
                )
              )
            ),
          });
          break;
        case 'pen':
          const pen = obj as unknown as fabric.Path;
          if (!pen.path) break;
          const toEdit = pen.path[pen.path.length - 1] as unknown as number[];
          toEdit[1] = event.pointer.x;
          toEdit[2] = event.pointer.y;
          this.currentDrawingObject = obj;
          break;
        default:
          break;
      }
      this.updateObjects(obj, 0);
    }
    if (
      this.app$?.action === 'pen' &&
      this.currentDrawingObject?.type == 'path' &&
      !this.isPathControlPointMoving
    ) {
      const pen = this.currentDrawingObject as unknown as fabric.Path & {
        isPathClosed?: boolean;
      };
      if (!pen?.path || pen.isPathClosed) return;

      this.reRender();
      const start = pen.path[pen.path.length - 1] as unknown as number[];
      this.tempRefObj = new fabric.Line(
        [
          start[3] || start[1],
          start[4] || start[2],
          event.pointer!.x,
          event.pointer!.y,
        ],
        {
          stroke: 'gray',
          strokeWidth: 1,
        }
      );
      this.canvas?.add(this.tempRefObj);
    }
  }

  onMouseUp(event: fabric.IEvent<MouseEvent>): void {
    if (!this.canvas) return;
    this.isDrawing = false;
    this.isPathControlPointMoving = false;

    if (this.app$?.action === 'pen') {
      if (
        this.currentDrawingObject &&
        this.currentDrawingObject.type === 'path'
      ) {
        const penPath = this.currentDrawingObject as fabric.Path & {
          isPathClosed?: boolean;
        };
        const path = penPath.path as unknown as number[][];

        if (
          Math.abs(path[0][1] - path[path.length - 1][3]) < 5 &&
          Math.abs(path[0][2] - path[path.length - 1][4]) < 5
        ) {
          fabric.loadSVGFromString(penPath.toSVG(), (str) => {
            this.updateObjects(str[0] as Object, 0);
            this.currentDrawingObject = undefined;
            this.setCurrentAction('select');
          });
        }
      }
      // return;
    }

    if (this.app$?.action !== 'pencil' && this.app$?.action !== 'pen') {
      this.currentDrawingObject = undefined;
      this.setCurrentAction('select');
    }
  }

  onPathCreated(e: { path: fabric.Path }): void {
    if (this.app$?.action !== 'pencil') return;
    const path = e.path as Object;
    path._id = uuidv4();
    this.updateObjects(path);
  }
  reRender() {
    this.objectsObserver?.next();
  }
  createObjects(e: fabric.IEvent<MouseEvent>, action: Actions) {
    if (!e.pointer) return;
    const { x, y } = e.pointer;
    if (action === 'line') {
      return new fabric.Line([x, y, x, y], {
        stroke: 'gray',
        strokeWidth: 5,
      }) as Object;
    } else if (action === 'rectangle') {
      return new fabric.Rect({
        top: e.pointer?.y,
        left: e.pointer?.x,
        fill: 'red',
        width: 0,
        height: 0,
      }) as Object;
    } else if (action === 'circle') {
      return new fabric.Circle({
        top: e.pointer?.y,
        left: e.pointer?.x,
        originX: 'center',
        originY: 'center',
        radius: 0,
        stroke: 'gray',
        fill: '',
      }) as Object;
    } else if (action === 'pen') {
      const quadraticCurve = new fabric.Path(`M ${x} ${y}`, {
        fill: '',
        stroke: 'red',
        strokeWidth: 5,
        objectCaching: false,
        selectable: false,
      });
      // const quadratic_curve_group = new fabric.Group();
      return quadraticCurve as Object;
    } else {
      return;
    }
  }

  setCurrentAction(action: Actions) {
    if (!this.canvas) return;
    this.store.dispatch(setAction({ action }));
    if (action === 'pencil') {
      this.canvas.isDrawingMode = true;
    } else {
      this.canvas.isDrawingMode = false;
    }
    if (action === 'select') {
      this.objectCustomization(true);
    } else {
      this.objectCustomization(false);
    }
  }

  objectCustomization(arg: boolean) {
    this.canvas?.getObjects().forEach((object) => {
      // Prevent customization:
      object.selectable = arg;
      object.evented = arg;
    });
    this.canvas?.renderAll();
  }
}
