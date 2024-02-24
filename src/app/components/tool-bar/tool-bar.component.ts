import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  inject,
} from '@angular/core';
import { Roles } from '../../../types/app.types';
import { Store } from '@ngrx/store';
import { appState } from '../../store/reducers/state.reducer';
import { appSelector } from '../../store/selectors/app.selector';
import { CommonModule } from '@angular/common';
import { Object } from '../../../types/app.types';
import { v4 as uuidv4 } from 'uuid';
import {
  setCanvasConfig,
  setCanvasConfigProp,
} from '../../store/actions/state.action';
import { fabric } from 'fabric';
import { CanvasService } from '../../services/canvas.service';
import { ExportComponent } from '../export/export.component';
@Component({
  selector: 'app-tool-bar',
  standalone: true,
  imports: [CommonModule, ExportComponent],
  templateUrl: './tool-bar.component.html',
  styleUrl: './tool-bar.component.css',
})
export class ToolBarComponent {
  @Output() setCurrentAction = new EventEmitter<Roles>();

  isExportComponentVisible: boolean = false;

  private store = inject(Store);
  app$: appState | undefined;
  setting: boolean = false;

  @ViewChild('fileInput') fileInput: ElementRef<HTMLInputElement> | undefined;
  @ViewChild('importInput') importInput:
    | ElementRef<HTMLInputElement>
    | undefined;

  constructor(private canvasService: CanvasService) {
    this.store.select(appSelector).subscribe((state) => (this.app$ = state));
  }
  roles: { role: Roles; icon: string }[] = [
    { role: 'select', icon: 'arrow_selector_tool' },
    { role: 'line', icon: 'pen_size_2' },
    { role: 'circle', icon: 'radio_button_unchecked' },
    { role: 'rectangle', icon: 'crop_3_2' },
    { role: 'pencil', icon: 'edit' },
    { role: 'pen', icon: 'ink_pen' },
    { role: 'text', icon: 'text_fields' },
    { role: 'image', icon: 'image' },
  ];

  onImageInput(files: FileList | null) {
    if (files && files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        typeof reader.result === 'string' &&
          fabric.Image?.fromURL(reader.result, (imgObj) => {
            const object = imgObj as Object;
            object._id = uuidv4();
            this.canvasService.updateObjects(object, 'push');
          });
      };
      reader.readAsDataURL(file);
    }
  }

  onClickActionButton(role: Roles) {
    this.setCurrentAction.emit(role);
    if (role === 'image') {
      this.fileInput?.nativeElement.click();
    }
  }
  export() {
    this.isExportComponentVisible = !this.isExportComponentVisible;
  }
  import(files: FileList | null) {
    if (files && files.length) {
      const file = files[0];
      const reader = new FileReader();
      reader.onload = () => {
        try {
          typeof reader.result === 'string' &&
            this.canvasService.importJsonObjects(reader.result);
        } catch (error) {
          console.error('json.parse error');
        }
      };
      reader.readAsText(file)
    }
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
      this.canvasService.canvas?.setBackgroundColor(
        data.backgroungColor,
        () => {}
      );
    this.canvasService.canvas?.renderAll();
  }
}
