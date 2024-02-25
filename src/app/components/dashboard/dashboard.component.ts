import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLinkActive, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent {
  constructor() {
  }

  folders:(folder|file)[] = [
    { type: 'file', data: '123' },
    { type: 'file', data: '123' },
    { type: 'file', data: '123' },
    {
      type: 'folder',
      data: [
        { type: 'file', data: '123' },
        { type: 'file', data: '123' },
        { type: 'folder', data: [{ type: 'file', data: '123' }] },
      ],
    },
  ];
}

type file={type:"file",data:any}
type folder={type:"folder",data:(file|folder)[]}
