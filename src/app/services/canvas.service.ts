import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { SocketService } from './socket.service';
import { Observable, Subscriber } from 'rxjs';
import { Object } from '../../types/app.types';
@Injectable({
  providedIn: 'root'
})
export class CanvasService {
  canvas: fabric.Canvas | undefined;
  objects: Object[] = [];
  objectsObserver: Subscriber<'objects' | 'role'> | undefined;
  tempRefObj: (
    | fabric.Line
    | (fabric.Circle & { _refTo: string; _refIndex: [number, number] })
  )[] = [];

  currentDrawingObject: Object | undefined;

  selectedObj: fabric.Object[] = [];

  constructor(private socketService: SocketService) {

    new Observable((observer) => {
      this.objectsObserver = observer;
    })?.subscribe((arg) => {
      if ('objects') {
        this.renderObjectsOnCanvas();
      }
    });

   }

   enliveObjcts(objects: any[]) {
    fabric.util.enlivenObjects(
      objects,
      (createdObjs: Object[]) => {
        this.objects = createdObjs;
        this.reRender();
      },
      'fabric'
    );
  }

  updateObjects(
    object: Object | Object[],
    method: 'push' | 'reset' | 'popAndPush' | 'replace' = 'push'
  ) {
    if (method === 'reset' && Array.isArray(object)) {
      this.objects = [...object];
    }

    if (method === 'push' && !Array.isArray(object)) {
      this.objects.push(object);
    } else if (method === 'popAndPush' && !Array.isArray(object)) {
      this.objects[this.objects.length - 1] = object;
    } else if (method === 'replace' && !Array.isArray(object)) {
      this.objects = this.objects.map((obj) => {
        if (object._id === obj._id) {
          return object;
        }
        return obj;
      });
    }
    this.reRender();
  }

  renderObjectsOnCanvas(backgroungColor?:string) {
    this.canvas?.clear();
    this.canvas?.setBackgroundColor(
      backgroungColor || '#282829',
      () => {}
    );
    const draw = (objects: Object[]) => {
      objects.forEach((obj) => {
        if (obj.type === 'group') {
          draw(obj._objects as Object[]);
        } else {
          this.canvas?.add(obj);
        }
      });
    };
    draw(this.objects);
    this.tempRefObj?.forEach((ref) => {
      this.canvas?.add(ref);
    });
  }

  reRender() {
    this.socketService.emit(
      'objects:modified',
      this.canvas?.toObject().objects
    );
    this.objectsObserver?.next('objects');
  }

}
