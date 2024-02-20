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
    // console.log(obj)
  }
  toggleControllability(obj: Object, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    this.reRender.emit();
    // console.log(obj)
  }
  onLeftClick(e: MouseEvent, data: Object) {
    this.canvas?.setActiveObject(data);
    this.canvas?.renderAll();
  }
  onRightClickAtLayer(e: MouseEvent) {
    e.preventDefault();
    this.context_menu = { x: e.clientX, y: e.clientY };
  }

  createGroup() {
    function add_series_Property(objects: obj_with_series[]) {
      console.log({ objects });
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
      // console.log(rootArray)
      const newGroup = new fabric.Group(selectedElements, {
        _id: newGroupId,
        series_index: seriesIndex,
      } as IGroupOptions).setCoords() as group & {
        _id: string;
      };
      // Function to recursively insert the new group
      const insertGroup = (array: obj_with_series[]): obj_with_series[] => {
        return array.flatMap((element) => {
          if (element.type === 'group' && element._objects) {
            // Recursively insert the new group into sub-elements
            element._objects = insertGroup(element._objects);
          }

          console.log(
            element.series_index === seriesIndex,
            element.series_index,
            ' ',
            seriesIndex
          );
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
