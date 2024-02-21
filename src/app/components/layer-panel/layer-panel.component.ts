import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Group, Object, Position } from '../../../types/app.types';
import { LayerPanelContextMenuComponent } from './layer-panel-context-menu/layer-panel-context-menu.component';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { IGroupOptions } from 'fabric/fabric-impl';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [LayerPanelContextMenuComponent],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.css',
})
export class LayerPanelComponent implements OnInit {
  @Input() canvas: fabric.Canvas | undefined;
  @Input() objects: Object[] | undefined;
  @Input() layers: Object[] | undefined;
  @Output() reRender = new EventEmitter<any>();
  @Output() updateObjects = new EventEmitter<{
    object: Object[];
    method?: 'reset';
  }>();
  context_menu: Position | null = null;
  ngOnInit(): void {
    document.addEventListener('click', () => {
      this.context_menu = null;
    });
  }
  toggleVisibility(obj: Object, arg?: boolean) {
    obj.visible = arg !== undefined ? arg : !obj.visible;
    this.reRender.emit();
  }
  toggleControllability(obj: Object, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    this.reRender.emit();
  }
  setActiveSelection(e: MouseEvent, object: Object) {
    let traversed: Object[] = [];
    const traverse = (item: Object | Object[]) => {
      if (Array.isArray(item)) {
        item.forEach((obj) => {
          if (obj.type === 'group') {
            traverse(obj._objects);
          } else {
            traversed.push(obj);
          }
        });
      } else {
        if (item.type === 'group') {
          traverse(item._objects);
        } else {
          traversed.push(item);
        }
      }
    };
    traverse(object);
    if (e.ctrlKey) {
      const pre = this.canvas?.getActiveObjects() as Object[] | undefined;
      if (pre?.length) {
        traversed.push(...pre);
        if (pre.some((ele) => ele._id === object._id)) {
          traversed = traversed.filter((ele) => ele._id !== object._id);
        } 
      }
    }
    if (traversed.length) {
      this.canvas?.discardActiveObject();
      const select = new fabric.ActiveSelection(traversed, {
        canvas: this.canvas,
      });

      this.canvas?.setActiveObject(select);
      this.canvas?.requestRenderAll();
    } else {
      console.log("traversed" + 'is empty');
    }
  }
  onLeftClick(e: MouseEvent, data: Object) {
    this.setActiveSelection(e, data);
  }
  onRightClickAtLayer(e: MouseEvent) {
    e.preventDefault();
    this.context_menu = { x: e.clientX, y: e.clientY };
  }

  createGroup() {
    function add_series_Property(objects: obj_with_series[]) {
      let count = 0;

      function traverse(obj: obj_with_series) {
        obj.series_index = count;
        count += 1;

        if (obj.type === 'group' && obj._objects) {
          obj._objects.forEach((subObj) => {
            traverse(subObj as obj_with_series);
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
    type series = { series_index?: number };
    // type group=Group&{_objects:obj_with_series[]}&series
    // type obj_with_series = Object & group & series;
    type group = fabric.Group & { _objects: obj_with_series[]; type: 'group' };

    type obj_with_series = (
      | (fabric.Path & { isPathClosed?: boolean; type: 'path' })
      | (fabric.Line & { type: 'line' })
      | (fabric.Rect & { type: 'rect' })
      | (fabric.Circle & { type: 'circle' })
      | (fabric.Image & { type: 'image' })
      | (fabric.IText & { type: 'i-text' })
      | group
    ) & {
      _id: string;
    } & series;

    // Function to create and insert a group at the specified position
    function createAndInsertGroup(
      rootArray: obj_with_series[],
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
            arr: obj_with_series[],
            id: string
          ): obj_with_series | undefined => {
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
      } as IGroupOptions).setCoords() as group & {
        _id: string;
      };
      newGroup._objects = selectedElements;
      // Function to recursively insert the new group
      const insertGroup = (array: obj_with_series[]): obj_with_series[] => {
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
    if (!this.objects) return;
    const updatedStack = createAndInsertGroup(
      add_series_Property([...this.objects]),
      (this.canvas?.getActiveObjects() as Object[] | undefined) || []
    );

    console.log({ updatedStack });
    this.updateObjects.emit({ object: updatedStack, method: 'reset' });
  }
}
