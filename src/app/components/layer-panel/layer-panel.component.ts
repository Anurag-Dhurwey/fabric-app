import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Object, Position } from '../../../types/app.types';
import { LayerPanelContextMenuComponent } from './layer-panel-context-menu/layer-panel-context-menu.component';

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
  @Output() reRender = new EventEmitter<any>();

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
  onRightClickAtLayer(e: MouseEvent) {
    e.preventDefault()
    this.context_menu = { x: e.clientX, y: e.clientY };
  }
}
