import { Component, HostListener, Input, OnInit } from '@angular/core';
import {
  Group,
  Group_with_series,
  Object,
  Object_with_series,
  Position,
} from '../../../types/app.types';
import { LayerPanelContextMenuComponent } from './layer-panel-context-menu/layer-panel-context-menu.component';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { IGroupOptions } from 'fabric/fabric-impl';
import { CanvasService } from '../../services/canvas/canvas.service';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [LayerPanelContextMenuComponent],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.css',
})
export class LayerPanelComponent implements OnInit {
  @Input() projectId: string | null = null;
  @Input() layers: Object[] | undefined;
  @Input() parentGroupIds: (string | null)[] = [];
  changeOrder: null | {
    from: { obj_id: string; group_id: string | null; index: number };
    to?: { group_id: string | null; index: number };
  } = null;
  // canChangeOrder:boolean=false
  constructor(public canvasService: CanvasService) {}

  @HostListener('window:mouseup', ['$event'])
  mouseup(event: MouseEvent) {
    this.changeOrderIndex();
    this.changeOrder = null;
    // this.canChangeOrder=false
  }

  context_menu: Position | null = null;
  ngOnInit(): void {
    document.addEventListener('click', () => {
      this.context_menu = null;
    });
  }

  traveseAndSetToAll(objects: Object[], property: keyof Object, value: any) {
    objects.forEach((obj) => {
      obj[property] = value;
      if (obj.type === 'group') {
        this.traveseAndSetToAll(obj._objects, property, value);
      }
    });
  }

  toggleVisibility(obj: Object, arg?: boolean) {
    obj.visible = arg !== undefined ? arg : !obj.visible;
    obj.evented = arg !== undefined ? arg : !obj.evented;
    if (obj.type === 'group') {
      this.traveseAndSetToAll(obj._objects, 'visible', obj.visible);
    }
    this.canvasService.reRender();
  }
  toggleControllability(obj: Object, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    obj.evented = arg !== undefined ? arg : !obj.evented;
    if (obj.type === 'group') {
      this.traveseAndSetToAll(obj._objects, 'selectable', obj.selectable);
    }
    this.canvasService.reRender();
  }
  setActiveSelection(e: MouseEvent, object: Object) {
    let traversed: Object[] = [];
    let traversedIds: string[] = [];
    const traverse = (item: Object | Object[]) => {
      if (Array.isArray(item)) {
        item.forEach((obj) => {
          if (obj.type === 'group') {
            traversedIds.push(obj._id);
            traverse(obj._objects);
          } else {
            traversed.push(obj);
            traversedIds.push(obj._id);
          }
        });
      } else {
        if (item.type === 'group') {
          traversedIds.push(item._id);
          traverse(item._objects);
        } else {
          traversedIds.push(item._id);
          traversed.push(item);
        }
      }
    };
    traverse(object);
    if (e.ctrlKey) {
      const pre = this.canvasService.canvas?.getActiveObjects() as
        | Object[]
        | undefined;
      if (pre?.length) {
        traversed.push(...pre);
        traversedIds.push(...this.canvasService.idsOfSelectedObj);
        if (pre.some((ele) => ele._id === object._id)) {
          traversed = traversed.filter((ele) => ele._id !== object._id);
        }
        if (
          this.canvasService.idsOfSelectedObj.some((id) => id === object._id)
        ) {
          traversedIds = traversedIds.filter((id) => id !== object._id);
        }

        traversed = traversed.filter((tra, i) => {
          return traversed.findIndex((obj) => obj._id === tra._id) === i;
        });

        traversedIds = [...new Set(traversedIds)];
      }
    }
    if (traversed.length) {
      this.canvasService.canvas?.discardActiveObject();
      const select =
        traversed.length > 1
          ? new fabric.ActiveSelection(traversed, {
              canvas: this.canvasService.canvas,
            })
          : traversed[0];

      this.canvasService.canvas?.setActiveObject(select);
      this.canvasService.idsOfSelectedObj = traversedIds;
      this.canvasService.canvas?.requestRenderAll();
    } else {
      console.log('traversed' + 'is empty');
    }
  }
  onLeftClick(e: MouseEvent, data: Object) {
    this.setActiveSelection(e, data);
  }
  onContextClickAtLayer(e: MouseEvent, obj: Object) {
    e.preventDefault();
    this.context_menu = { x: e.clientX, y: e.clientY };
    if (this.canvasService.idsOfSelectedObj.length) {
      if (!this.canvasService.idsOfSelectedObj.includes(obj._id)) {
        this.canvasService.idsOfSelectedObj = [obj._id];
      }
    } else {
      this.canvasService.idsOfSelectedObj = [obj._id];
    }
  }

  createGroup() {
    function add_series_Property(objects: Object_with_series[]) {
      let count = 0;

      function traverse(obj: Object_with_series) {
        obj.series_index = count;
        count += 1;

        if (obj.type === 'group' && obj._objects) {
          obj._objects.forEach((subObj) => {
            traverse(subObj as Object_with_series);
          });
        }
      }

      objects.forEach((obj) => {
        traverse(obj);
      });
      return objects;
    }
    // Recursive function to find and remove elements from the root array
    function findAndRemoveElement(
      array: Object[],
      elementId: string,
      group_id_to_ignore_removel: string
    ) {
      let found = false;

      array.forEach((element, index) => {
        if (element._id === elementId) {
          array.splice(index, 1);
          found = true; // Element found and removed
        } else if (
          element.type === 'group' &&
          element._id != group_id_to_ignore_removel &&
          element._objects
        ) {
          // Recursively search in sub-elements for groups
          if (
            findAndRemoveElement(
              element._objects,
              elementId,
              group_id_to_ignore_removel
            )
          ) {
            found = true; // Element found and removed in sub-elements
          }
        }
      });

      return found; // Return whether the element was found
    }

    // Function to create and insert a group at the specified position
    function createAndInsertGroup(
      rootArray: Object_with_series[],
      selectedElements: Object[]
    ) {
      if (!selectedElements.length) return rootArray;
      // Remove selected elements from their original positions
      const newGroupId = v4();

      // const newRoot = add_series_Property(rootArray);
      // Calculate the series index for the new group
      const seriesIndex = Math.min(
        ...selectedElements.map((element) => {
          const gets_i = (
            arr: Object_with_series[],
            id: string
          ): Object_with_series | undefined => {
            for (const ele of arr) {
              if (ele._id === id) {
                return ele;
              } else if (ele.type === 'group') {
                return gets_i(ele._objects, id);
              }
            }
            return;
          };

          return gets_i(rootArray, element._id)?.series_index as number;
        })
      );
      // console.log(selectedElements[0].left,selectedElements[0].top)
      const newGroup = new fabric.Group([], {
        _id: newGroupId,
        series_index: seriesIndex,
        top: selectedElements[0].top,
        left: selectedElements[0].left,
      } as IGroupOptions).setCoords() as Group_with_series & {
        _id: string;
      };
      newGroup._objects = selectedElements;
      // Function to recursively insert the new group
      const insertGroup = (
        array: Object_with_series[]
      ): Object_with_series[] => {
        return array.flatMap((element) => {
          if (element.type === 'group' && element._objects) {
            // Recursively insert the new group into sub-elements
            element._objects = insertGroup(element._objects);
          }

          if (element.series_index === seriesIndex) {
            return [newGroup, element];
          } else {
            return [element];
          }
        });
      };

      rootArray = insertGroup(rootArray);

      selectedElements.forEach((element) => {
        findAndRemoveElement(rootArray, element._id, newGroupId);
      });

      return rootArray;
    }
    if (!this.canvasService.objects) return;
    const updatedStack = createAndInsertGroup(
      add_series_Property([...this.canvasService.objects]),
      (this.canvasService.canvas?.getActiveObjects() as Object[] | undefined) ||
        []
    );

    this.canvasService.updateObjects(updatedStack, 'reset');
  }

  parentGroupIdsForChild(id: string) {
    return [...this.parentGroupIds, id];
  }

  setObjToMove(id: string, group_id: string | null, index: number) {
    // this.canChangeOrder=true
    this.changeOrder = {
      from: { obj_id: id, index, group_id },
    };
  }

  setPositionToMove(group_id: string | null, index: number) {
    if ( this.changeOrder?.from) {
      this.changeOrder.to = { group_id, index };
      console.log(group_id,index)
    }

  }

  changeOrderIndex() {
    // Function to find an element or group by ID in a nested structure
    function findElementById(
      id: string | null,
      array: Object[]
    ): Object | null {
      for (const element of array) {
        if (element._id === id) {
          return element;
        }
        if (element.type === 'group' && element._objects) {
          const found = findElementById(id, element._objects);
          if (found) {
            return found;
          }
        }
      }
      return null;
    }

    // Function to move elements within the nested structure
    function moveElements(
      data: Object[],
      sourceIds: string[],
      group_id: string | null,
      targetIndex: number
    ) {
      const sourceElements = sourceIds
        .map((id) => findElementById(id, data))
        .filter((element): element is Object => element !== null);

      // Remove the source elements from their original positions
      const removeElements = (array: Object[]) => {
        sourceIds.forEach((sourceId) => {
          const index = array.findIndex((element) => element._id === sourceId);
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

      removeElements(data);

      // Find the target element or group
      const targetParent = findElementById(group_id, data);

      // If target is a group, move the source elements to its "elements" property
      if (targetParent?.type === 'group' && targetParent._objects) {
        targetParent._objects.splice(targetIndex, 0, ...sourceElements);
      } else {
        // If target is not a group, move the source elements to the main array
        data.splice(targetIndex, 0, ...sourceElements);
      }
      return data;
    }

    if (
      this.changeOrder?.from.obj_id &&
      this.changeOrder.to?.group_id !== undefined
    ) {
      const updatedStack = moveElements(
        [...this.canvasService.objects],
        [this.changeOrder.from.obj_id],
        this.changeOrder.to.group_id,
        this.changeOrder.to.index
      );
      this.canvasService.updateObjects(updatedStack, 'reset');
    }
  
  }

  isEqualToChangeOrder_to(index: number, group_id: string|null) {
    return (
      this.changeOrder?.to?.group_id === group_id &&
      index === this.changeOrder.to.index
    );
  }
}
