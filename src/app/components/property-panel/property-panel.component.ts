import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { Object } from '../../../types/app.types';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  @Input() canvas: fabric.Canvas | undefined;
  @Input() objects: Object[] | undefined;
  @Output() reRender = new EventEmitter<any>();
  selectedObj: fabric.Object[] = [];
  constructor() {}
  ngAfterViewInit() {
    this.canvas?.on('selection:created', (event) => {
      if (!event.selected) return;
      this.selectedObj = event.selected;
    });
    this.canvas?.on('selection:cleared', () => {
      this.selectedObj = [];
    });
  }
}
