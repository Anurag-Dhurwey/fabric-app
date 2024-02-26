import { Component, EventEmitter, HostListener, Output } from '@angular/core';
import { CanvasService } from '../../services/canvas/canvas.service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
@Component({
  selector: 'app-export',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './export.component.html',
  styleUrl: './export.component.css',
})
export class ExportComponent {
  @Output() onCloseClick = new EventEmitter<any>();

  file_name = new FormControl('');
  file_type = new FormControl('jpeg');
  windowWidth: number = window.innerWidth;
  windowHeight: number = window.innerHeight;

  constructor(private canvasService: CanvasService) {}

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.windowWidth = event.target.innerWidth;
    this.windowHeight = event.target.innerHeight;
  }

  exportFile() {
    if (!this.canvasService.canvas) {
      return;
    }
    const click = (imageDataURL: string | undefined) => {
      if (!imageDataURL) {
        alert('something went wrong');
        return;
      }
      const link = document.createElement('a');
      link.href = imageDataURL;
      link.download = this.file_name.value || 'myDrawing';
      link.click();
    };
    // const canvas = document.getElementById("canvas") as HTMLCanvasElement;
    if (this.file_type.value === 'png') {
      click(this.canvasService?.canvas?.toDataURL({ format: 'image/png' }));
    } else if (this.file_type.value === 'jpeg') {
      click(this.canvasService.canvas?.toDataURL({ format: 'image/jpeg' }));
    } else if (this.file_type.value === 'pdf') {
      const { width, height } = this.canvasService.canvas;
      const pdf = new jsPDF({
        orientation: width! > height! ? 'landscape' : 'portrait',
        unit: 'px',
        format: [width!, height!],
      });
      const dataImg = this.canvasService.canvas.toDataURL({
        format: 'image/png',
      });
      pdf.addImage(dataImg, 'PNG', 0, 0, width!, height!);
      pdf.save(`${this.file_name || 'myDrawing'}`);
    } else if (this.file_type.value === 'JSON') {
      const blob = new Blob(
        [JSON.stringify(this.canvasService.canvas.toJSON())],
        { type: 'application/json' }
      );
      const url = URL.createObjectURL(blob);
      click(url);
      URL.revokeObjectURL(url);
    } else {
      throw new Error('file type not recognized');
    }
  }
}
