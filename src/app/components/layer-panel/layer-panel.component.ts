import { Component,  Input, OnInit } from '@angular/core';
import { Group, Group_with_series, Object, Object_with_series, Position } from '../../../types/app.types';
import { LayerPanelContextMenuComponent } from './layer-panel-context-menu/layer-panel-context-menu.component';
import { fabric } from 'fabric';
import { v4 } from 'uuid';
import { IGroupOptions } from 'fabric/fabric-impl';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [LayerPanelContextMenuComponent],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.css',
})
export class LayerPanelComponent implements OnInit {
  // @Input() canvas: fabric.Canvas | undefined;
  // @Input() objects: Object[] | undefined;
  @Input() layers: Object[] | undefined;
  // @Output() reRender = new EventEmitter<any>();
  // @Output() updateObjects = new EventEmitter<{
  //   object: Object[];
  //   method?: 'reset';
  // }>();
  constructor(public canvasService: CanvasService) {}
  context_menu: Position | null = null;
  ngOnInit(): void {
    document.addEventListener('click', () => {
      this.context_menu = null;
    });
  }
  toggleVisibility(obj: Object, arg?: boolean) {
    obj.visible = arg !== undefined ? arg : !obj.visible;
    this.canvasService.reRender();
  }
  toggleControllability(obj: Object, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    this.canvasService.reRender();
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
      const pre = this.canvasService.canvas?.getActiveObjects() as
        | Object[]
        | undefined;
      if (pre?.length) {
        traversed.push(...pre);
        if (pre.some((ele) => ele._id === object._id)) {
          traversed = traversed.filter((ele) => ele._id !== object._id);
        }
        const ids: string[] = [];
        traversed = traversed.filter((tra) => {
          if (!ids.includes(tra._id)) {
            ids.push(tra._id);
            return true;
          }
          return false;
        });
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
      this.canvasService.canvas?.requestRenderAll();
    } else {
      console.log('traversed' + 'is empty');
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
      const insertGroup = (array: Object_with_series[]): Object_with_series[] => {
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
}
