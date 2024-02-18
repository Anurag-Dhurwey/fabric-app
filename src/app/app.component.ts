import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToolBarComponent } from './components/tool-bar/tool-bar.component';
import { Store } from '@ngrx/store';
import { AsyncPipe, CommonModule } from '@angular/common';
import { appSelector } from './store/selectors/app.selector';
import { appState } from './store/reducers/state.reducer';
import { setRole } from './store/actions/state.action';
import { Roles, Object, Presense } from '../types/app.types';
import { fabric } from 'fabric';
import { Observable, Subscriber } from 'rxjs';
import { v4 as uuidv4 } from 'uuid';
import { SocketService } from './services/socket.service';
import { LayerPanelComponent } from './components/layer-panel/layer-panel.component';
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, ToolBarComponent, LayerPanelComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit {
  title = 'fabric app';
  app$: appState | undefined;
  objects: Object[] = [];
  objectsObserver: Subscriber<'objects' | 'action'> | undefined;
  tempRefObj: (
    | fabric.Line
    | (fabric.Circle & { _refTo: string; _refIndex: [number, number] })
  )[] = [];
  presense: Presense[] = [];
  isDrawing: boolean = false;
  currentDrawingObject: Object | undefined;
  canvas: fabric.Canvas | undefined;
  isPathControlPointMoving: boolean = false;
  pathPointToAdjust:
    | { _refTo: fabric.Path; points: [number, number] }
    | undefined;
  private store = inject(Store);

  constructor(private socketService: SocketService) {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }

  ngOnInit(): void {
    // this.socketService.connect();
    const board = document.getElementById('canvas') as HTMLCanvasElement;
    board.width = window.innerWidth;
    board.height = window.innerHeight;
    this.canvas = new fabric.Canvas(board, {
      backgroundColor: this.app$?.canvasConfig.backgroungColor,
    });
    window.addEventListener('resize', () => {
      board.width = window.innerWidth;
      board.height = window.innerHeight;
      this.canvas?.setHeight(window.innerHeight);
      this.canvas?.setWidth(window.innerWidth);
    });
    // this.canvas.on('mouse:over', (event) => console.log(event));
    this.canvas.on('mouse:down', (event) => this.onMouseDown(event));
    this.canvas.on('mouse:dblclick', (event) => this.onMouseDoubleClick(event));
    this.canvas.on('mouse:move', (event) => this.onMouseMove(event));
    this.canvas.on('mouse:up', (event) => this.onMouseUp(event));
    this.canvas.on('path:created', (event) =>
      this.onPathCreated(event as unknown as { path: fabric.Path })
    );
    this.canvas.on('object:moving', (event) => {
      this.socketService.emit(
        'objects:modified',
        this.canvas?.toObject().objects
      );

      const target = event.target as
        | (fabric.Circle & {
            _refTo?: fabric.Path & { _id: string };
            _refIndex?: [number, number];
          })
        | undefined;
      if (target?._refTo?.path && target._refIndex) {
        if (target._refIndex[1] === 1) {
          // const ref = target._refTo;
          // const arr = ref.path![target._refIndex[0]] as unknown as number[];
          // arr[1] = event.pointer!.x;
          // arr[2] = event.pointer!.y;
          // this.updateObjects(ref, 'replace');
        } else if (target._refIndex[1] === 2) {
          // const ref = target._refTo;
          // const arr = ref.path![target._refIndex[0]] as unknown as number[];
          // arr[3] = event.pointer!.x;
          // arr[4] = event.pointer!.y;
          // this.updateObjects(ref, 'replace');
        }
      }
    });
    new Observable((observer) => {
      this.objectsObserver = observer;
    })?.subscribe((arg) => {
      if ('objects') {
        this.renderObjectsOnCanvas();
      } else if ('action') {
      }
    });

    this.socketService.on('objects:modified', (new_objects) => {
      this.initializeObjcts(new_objects);
    });

    this.socketService.on('objects', (objects) => {
      this.initializeObjcts(objects);
    });
    this.socketService.on('mouse:move', (data: Presense[]) => {
      this.presense = data;
    });

    this.socketService.emit('objects', {});
  }

  initializeObjcts(objects: any[]) {
    fabric.util.enlivenObjects(
      objects,
      (createdObjs: Object[]) => {
        this.objects = createdObjs;
        this.reRender();
      },
      'fabric'
    );
  }
  renderObjectsOnCanvas() {
    this.canvas?.clear();
    this.canvas?.setBackgroundColor(
      this.app$?.canvasConfig.backgroungColor || '#282829',
      () => {}
    );
    this.objects.forEach((obj) => {
      this.canvas?.add(obj);
    });
    this.tempRefObj?.forEach((ref) => {
      this.canvas?.add(ref);
    });
  }

  // this updateObjects takes to arguments object and method
  // method could be 0 or 1
  // if 0 then object will replace last element of this.objects
  // if 1 then object will be pushed to this.objects

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
        this.updateObjects(this.currentDrawingObject, 'popAndPush');
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
  onMouseDoubleClick(event: fabric.IEvent<MouseEvent>): void {
    if (this.app$?.action === 'select' && event.target?.type === 'path') {
      const path = event.target as fabric.Path & { _id: string };
      this.tempRefObj = [];
      path.path?.forEach((points, i) => {
        const arrPoint = points as unknown as number[];
        let ctrlOne = new fabric.Circle({
          left: Math.floor(arrPoint[1]),
          top: Math.floor(arrPoint[2]),
          radius: 5,
          fill: 'blue',
        }) as fabric.Circle & {
          _refTo: fabric.Path;
          _refIndex: [number, number];
        };

        ctrlOne._refTo = path;
        ctrlOne._refIndex = [i, 1];
        let ctrlTwo =
          path.path &&
          i < path.path?.length - 1 &&
          arrPoint[3] &&
          arrPoint[4] &&
          (new fabric.Circle({
            left: arrPoint[3],
            top: arrPoint[4],
            radius: 5,
            fill: 'blue',
          }) as unknown as fabric.Circle & {
            _refTo: fabric.Path;
            _refIndex: [number, number];
          });
        this.canvas?.add(ctrlOne);
        this.tempRefObj.push(ctrlOne as any);
        if (ctrlTwo) {
          ctrlTwo._refTo = path;
          ctrlTwo._refIndex = [i, 2];
          this.canvas?.add(ctrlTwo);
          this.tempRefObj.push(ctrlTwo as any);
        }
      });
    }
  }
  onMouseMove(event: fabric.IEvent<MouseEvent>): void {
    this.socketService.emit('mouse:move', {
      x: event.pointer?.x,
      y: event.pointer?.y,
    });
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
      this.updateObjects(obj, 'popAndPush');
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
      this.tempRefObj[0] = new fabric.Line(
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
      this.canvas?.add(this.tempRefObj[0]);
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
          _id: string;
        };
        const path = penPath.path as unknown as number[][];

        if (
          Math.abs(path[0][1] - path[path.length - 1][3]) < 5 &&
          Math.abs(path[0][2] - path[path.length - 1][4]) < 5
        ) {
          this.loadSVGFromString(penPath);
        }
      }
      // return;
    }

    if (
      this.app$?.action !== 'pencil' &&
      this.app$?.action !== 'select' &&
      this.app$?.action !== 'pen'
    ) {
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
    this.objectsObserver?.next('objects');
    console.log('re');
  }
  createObjects(e: fabric.IEvent<MouseEvent>, action: Roles) {
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

  setCurrentAction(action: Roles) {
    if (!this.canvas) return;
    this.store.dispatch(setRole({ action }));
    if (this.currentDrawingObject?.type === 'path') {
      this.loadSVGFromString(this.currentDrawingObject);
    }
    this.currentDrawingObject = undefined;
    this.reRender();
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
    this.tempRefObj = [];
  }

  objectCustomization(arg: boolean) {
    this.canvas?.getObjects().forEach((object) => {
      // Prevent customization:
      object.selectable = arg;
      object.evented = arg;
    });
    this.canvas?.renderAll();
  }

  loadSVGFromString(data: Object) {
    fabric.loadSVGFromString(data.toSVG(), (str) => {
      const newPath = str[0] as Object;
      newPath._id = uuidv4();
      this.updateObjects(newPath, 'popAndPush');
      this.currentDrawingObject = undefined;
      this.setCurrentAction('select');
    });
  }
  updateObjects(
    object: Object | Object[],
    method: 'push' | 'replaceAll' | 'popAndPush' | 'replace' = 'push'
  ) {
    if (method === 'replaceAll' && Array.isArray(object)) {
      this.objects = object;
    }

    if (method === 'push' && !Array.isArray(object)) {
      this.objects.push(object);
    } else if (method === 'popAndPush' && !Array.isArray(object)) {
      this.objects[this.objects.length - 1] = object;
    } else if (method === 'replace' && !Array.isArray(object)) {
      this.objects = this.objects.map((obj) => {
        if (object._id === obj._id) {
          console.log('got');
          return object;
        }
        return obj;
      });
    }
    this.objectsObserver?.next('objects');
    this.socketService.emit(
      'objects:modified',
      this.canvas?.toObject().objects
    );
  }
}
