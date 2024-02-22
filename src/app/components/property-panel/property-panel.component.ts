import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { Object } from '../../../types/app.types';
import { CanvasService } from '../../services/canvas.service';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  // @Input() canvas: fabric.Canvas | undefined;
  // @Input() objects: Object[] | undefined;
  // @Output() reRender = new EventEmitter<any>();
  // selectedObj: fabric.Object[] = [];
  constructor( public canvasService: CanvasService) {}
  ngAfterViewInit() {
    this.canvasService.canvas?.on('selection:created', (event) => {
      if (!event.selected) return;
      this.canvasService.selectedObj = event.selected;
    });
    this.canvasService.canvas?.on('selection:updated', (event) => {
      if (!event.selected) return;
      this.canvasService.selectedObj = event.selected;
    });
    this.canvasService.canvas?.on('selection:cleared', () => {
      this.canvasService.selectedObj = [];
    });
  }
}
