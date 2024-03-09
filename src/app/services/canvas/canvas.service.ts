import { Injectable } from '@angular/core';
import { fabric } from 'fabric';
import { SocketService } from '../socket/socket.service';
import { Observable, Subscriber } from 'rxjs';
import { Group,  Object } from '../../../types/app.types';
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

  selectedObj: Object[] = [];
  // idsOfSelectedObj: string[] = [];
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

  get idsOfSelectedObj() {
    function traverse(obj: Object[]): string[] {
      return obj.flatMap((ob: Object) => {
        if (ob.type === 'group') {
          return [ob._id, ...traverse(ob._objects)];
        } else {
          return [ob._id];
        }
      });
    }

    return traverse(this.selectedObj);
  }

  get oneArrayOfSelectedObj() {
    function traverse(obj: Object[]): Object[] {
      return obj.flatMap((ob: Object) => {
        if (ob.type === 'group') {
          return traverse(ob._objects);
        } else {
          return [ob];
        }
      });
    }

    return traverse(this.selectedObj);
  }

  isSelected(id: string) {
    function isExist(objs: Object[]): boolean | void {
      for (const ob of objs) {
        if (ob.type === 'group') {
          if (ob._id === id) {
            return true;
          } else {
            return isExist(ob._objects);
          }
        } else {
          if (ob._id === id) {
            return true;
          }
        }
      }
    }
    return !!isExist(this.selectedObj);
  }

  seriesIndex(id: string) {
    let count = 0;
    // let index: null | number = null;

    function traverse(obj: Object): number | void {
      if (obj._id === id) {
        // index = count;
        return count;
      }
      count += 1;
      if (obj.type === 'group' && obj._objects) {
        // obj._objects.forEach((subObj: Object) => {
        //   traverse(subObj);
        // });
        for (const subObj of obj._objects) {
          return traverse(subObj);
        }
      }
    }

    for (const obj of this.objects) {
      const index = traverse(obj);
      if (Number.isInteger(index)) {
        return index;
      }
    }
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
          } as IGroupOptions) as Group
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
      objects: this.canvas?.toObject(['_id', 'name']).objects,
    });
    // }
  }

  removeObjectsByIds(ids: string[]) {
    console.log(ids);
    const removeElements = (array: Object[]) => {
      ids.forEach((Id) => {
        const index = array.findIndex((element) => element._id === Id);
        console.log(index);
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
      objects: this.canvas?.toObject(['_id', 'name']).objects,
    });
    // this.idsOfSelectedObj = [];
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
