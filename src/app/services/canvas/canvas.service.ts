import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { SocketService } from '../socket/socket.service';
import { Observable, Subscriber } from 'rxjs';
import { Group_with_series, Object } from '../../../types/app.types';
import { v4 } from 'uuid';
import { IGroupOptions } from 'fabric/fabric-impl';
import { AuthService } from '../auth/auth.service';
@Injectable({
  providedIn: 'root',
})
export class CanvasService {
  canvas: fabric.Canvas | undefined;
  objects: Object[] = [];
  projectId: string | null = null;
  version: string | undefined;
  background: string | undefined;
  members: string[] = [];
  adminId: string | undefined;
  objectsObserver: Subscriber<'objects' | 'role'> | undefined;
  tempRefObj: (
    | fabric.Line
    | (fabric.Circle & { _refTo: string; _refIndex: [number, number] })
  )[] = [];

  currentDrawingObject: Object | undefined;

  selectedObj: fabric.Object[] = [];

  constructor(
    private socketService: SocketService,
    private authService: AuthService
  ) {
    new Observable((observer) => {
      this.objectsObserver = observer;
    })?.subscribe((arg) => {
      if ('objects') {
        this.renderObjectsOnCanvas();
      }
    });
  }

  enliveObjcts(objects: any[], replace: boolean = false): void {
    fabric.util.enlivenObjects(
      objects,
      (createdObjs: Object[]) => {
        if (replace) {
          this.objects = createdObjs;
          this.reRender();
        }
      },
      'fabric'
    );
  }

  importJsonObjects(json: string) {
    fabric.util.enlivenObjects(
      JSON.parse(json).objects,
      (objects: any) => {
        if (!objects || !objects.length) return;
        function changeId(objects: Object[]) {
          objects.forEach((obj) => {
            obj._id = v4();
            if (obj.type === 'group') {
              obj.isMinimized = true;
              changeId(obj._objects);
            }
          });
        }
        changeId(objects);

        if (objects.length === 1 && objects[0].type === 'group') {
          this.objects = [objects[0], ...this.objects];
        } else {
          const newGroup = new fabric.Group([], {
            _id: v4(),
            top: objects[0].top,
            left: objects[0].left,
          } as IGroupOptions) as Group_with_series & {
            _id: string;
          };
          newGroup._objects = objects;
          this.objects = [newGroup, ...this.objects];
        }
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
    // if (
    //   this.projectId&&
    //   this.authService.auth.currentUser &&
    //   (this.members.includes(this.authService.auth.currentUser!.uid) ||
    //     this.authService.auth.currentUser?.uid === this.adminId)
    // ) {
    this.socketService.emit('objects:modified', {
      roomId: this.projectId,
      objects: this.canvas?.toObject().objects,
    });
    // }
  }

  removeObjectsByIds(ids: string[]) {
    const removeElements = (array: Object[]) => {
      ids.forEach((Id) => {
        const index = array.findIndex((element) => element._id === Id);
        if (index !== -1) {
          array.splice(index, 1);
        }
      });

      for (const element of array) {
        if (element.type === 'group' && element._objects) {
          removeElements(element._objects);
        }
      }
    };

    removeElements(this.objects);
    this.reRender();
    this.socketService.emit('objects:modified', {
      roomId: this.projectId,
      objects: this.canvas?.toObject().objects,
    });
  }

  renderObjectsOnCanvas(backgroungColor?: string) {
    this.canvas?.clear();
    this.canvas?.setBackgroundColor(backgroungColor || '#282829', () => {});
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
    this.objectsObserver?.next('objects');
  }
}
