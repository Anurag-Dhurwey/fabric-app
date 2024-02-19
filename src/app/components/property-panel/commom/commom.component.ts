import { Component } from '@angular/core';
import { CommonProperty } from '../../../../types/app.types';

@Component({
  selector: 'app-commom',
  standalone: true,
  imports: [],
  templateUrl: './commom.component.html',
  styleUrl: './commom.component.css',
})
export class CommomComponent {
  commonData:CommonProperty[] = [
    {
      title: 'Position',
      keys: [
        {
          lable: 'Top',
          key: 'top',
          val_type: 'number',
          inputBox_type:'number'
        },
        {
          lable: 'Left',
          key: 'left',
          val_type: 'number',
          inputBox_type:'number'
        },
      ],
    },
    {
      title: 'Size',
      keys: [
        {
          lable: 'Width',
          key: 'width',
          val_type: 'number',
          inputBox_type:'number'
        },
        {
          lable: 'Height',
          key: 'height',
          val_type: 'number',
          inputBox_type:'number'
        },
        {
          lable: 'ScaleX',
          key: 'scaleX',
          val_type: 'number',
          inputBox_type:'number'
        },
        {
          lable: 'ScaleY',
          key: 'scaleY',
          val_type: 'number',
          inputBox_type:'number'
        },
      ],
    },
    {
      title: 'Flip',
      keys: [
        {
          lable: 'X',
          key: 'flipX',
          val_type: 'boolean',
          inputBox_type:'checkbox'
        },
        {
          lable: 'Y',
          key: 'flipY',
          val_type: 'boolean',
          inputBox_type:'checkbox'
        },
      ],
    },
    {
      title: 'Stroke',
      keys: [
        {
          lable: 'Color',
          key: 'stroke',
          val_type: 'string',
          inputBox_type:'color'
        },
        {
          lable: 'Size',
          key: 'strokeWidth',
          val_type: 'number',
          inputBox_type:'number'
        },
      ],
    },
    {
      title: 'Others',
      keys: [
        {
          lable: 'Background',
          key: 'backgroundColor',
          val_type: 'string',
          inputBox_type:'color'
        },
        {
          lable: 'Fill',
          key: 'fill',
          val_type: 'string',
          inputBox_type:'color'
        },
        {
          lable: 'Opacity',
          key: 'opacity',
          val_type: 'number',
          inputBox_type:'number'
        },
      ],
    },
  ];




}


