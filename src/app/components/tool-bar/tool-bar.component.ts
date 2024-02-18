import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { Roles } from '../../../types/app.types';
import { Store } from '@ngrx/store';
import { appState } from '../../store/reducers/state.reducer';
import { appSelector } from '../../store/selectors/app.selector';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import {
  setCanvasConfig,
  setCanvasConfigProp,
} from '../../store/actions/state.action';
@Component({
  selector: 'app-tool-bar',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './tool-bar.component.html',
  styleUrl: './tool-bar.component.css',
})
export class ToolBarComponent {
  @Input() canvas: fabric.Canvas | undefined;
  @Output() setCurrentAction = new EventEmitter<Roles>();
  @Output() reRender = new EventEmitter<any>();
  private store = inject(Store);
  app$: appState | undefined;
  setting: boolean = false;
  constructor() {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }
  roles: { role: Roles; icon: string }[] = [
    { role: 'select', icon: 'arrow_selector_tool' },
    { role: 'line', icon: 'pen_size_2' },
    { role: 'circle', icon: 'radio_button_unchecked' },
    { role: 'rectangle', icon: 'crop_3_2' },
    { role: 'pencil', icon: 'edit' },
    { role: 'pen', icon: 'ink_pen' },
  ];
  onClickActionButton(role: Roles) {
    this.setCurrentAction.emit(role);
  }
  exportCanvasObjectsToJson() {
    console.log(this.canvas?.toJSON());
  }
  toggleSetting(arg?: boolean) {
    this.setting = arg != undefined ? arg : !this.setting;
  }

  setCanvasBackground(color: string | null) {
    color && this.configCanvas({ backgroungColor: color });
  }

  configCanvas(data: setCanvasConfigProp) {
    this.store.dispatch(setCanvasConfig(data));
    data.backgroungColor &&
      this.canvas?.setBackgroundColor(data.backgroungColor, () => {});
      this.canvas?.renderAll()
  }
}
