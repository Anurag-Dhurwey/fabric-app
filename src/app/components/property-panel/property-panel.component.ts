import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css'
})
export class PropertyPanelComponent {
  @Input() canvas: fabric.Canvas | undefined;
  @Input() objects: Object[] | undefined;
  @Output() reRender = new EventEmitter<any>();
}
