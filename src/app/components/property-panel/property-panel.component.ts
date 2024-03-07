import { Component } from '@angular/core';
import { CommomComponent } from './commom/commom.component';
import { CanvasService } from '../../services/canvas/canvas.service';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [CommomComponent],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.css',
})
export class PropertyPanelComponent {
  constructor(public canvasService: CanvasService) {}
  ngAfterViewInit() {
    this.canvasService.canvas?.on('selection:created', (event) => {
      if (!event.selected) return;
      event.selected.forEach((obj: any) => {
        this.canvasService.idsOfSelectedObj.push(obj._id)
      });
      this.canvasService.selectedObj = event.selected;
    });
    this.canvasService.canvas?.on('selection:updated', (event) => {
      if (!event.selected) return;
      this.canvasService.idsOfSelectedObj=[]
      event.selected.forEach((obj: any) => {
        this.canvasService.idsOfSelectedObj.push(obj._id)
      });
      this.canvasService.selectedObj = event.selected;
    });
    this.canvasService.canvas?.on('selection:cleared', () => {
      this.canvasService.selectedObj = [];
      this.canvasService.idsOfSelectedObj = [];
    });
  }
}
