import { Component, EventEmitter, Input,  Output } from '@angular/core';
import { Object } from '../../../types/app.types';

@Component({
  selector: 'app-layer-panel',
  standalone: true,
  imports: [],
  templateUrl: './layer-panel.component.html',
  styleUrl: './layer-panel.component.css',
})
export class LayerPanelComponent  {
  @Input() canvas: fabric.Canvas | undefined;
  @Input() objects: Object[] | undefined;
  @Output() reRender = new EventEmitter<any>();


  toggleVisibility(obj: Object, arg?: boolean) {
    obj.visible = arg !== undefined ? arg : !obj.visible;
    this.reRender.emit();
  }
  toggleControllability(obj: Object, arg?: boolean) {
    obj.selectable = arg !== undefined ? arg : !obj.selectable;
    this.reRender.emit();
  }
}
