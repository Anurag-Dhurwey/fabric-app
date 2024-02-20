import { Component, Input } from '@angular/core';
import { Position } from '../../../../types/app.types';

@Component({
  selector: 'app-layer-panel-context-menu',
  standalone: true,
  imports: [],
  templateUrl: './layer-panel-context-menu.component.html',
  styleUrl: './layer-panel-context-menu.component.css'
})
export class LayerPanelContextMenuComponent {
  @Input() position: Position | undefined|null;
  
}
