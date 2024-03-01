export type Roles =
  | 'select'
  | 'pen'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'pencil'
  | 'image'
  | 'text';

export type Group = fabric.Group & {
  _objects: Object[];
  type: 'group';
  isMinimized?: boolean;
};

export type Object = (
  | (fabric.Path & { isPathClosed?: boolean; type: 'path' })
  | (fabric.Line & { type: 'line' })
  | (fabric.Rect & { type: 'rect' })
  | (fabric.Circle & { type: 'circle' })
  | (fabric.Image & { type: 'image' })
  | (fabric.IText & { type: 'i-text' })
  | Group
) & {
  _id: string;
};

export type Position = { x: number; y: number };
export type Presense = { id: string; mouse: Position; expire: number };


export type CommonProperty = {
  title: string;
  keys: {
    lable: string;
    key: keyof fabric.Object;
    val_type: string;
    inputBox_type: string;
    min?: number;
    max?: number;
    step?: number;
  }[];
};

export type series = { series_index?: number };
export type Group_with_series = fabric.Group & {
  _objects: Object_with_series[];
  type: 'group';
  isMinimized?: boolean;
};

export type Object_with_series = (
  | (fabric.Path & { isPathClosed?: boolean; type: 'path' })
  | (fabric.Line & { type: 'line' })
  | (fabric.Rect & { type: 'rect' })
  | (fabric.Circle & { type: 'circle' })
  | (fabric.Image & { type: 'image' })
  | (fabric.IText & { type: 'i-text' })
  | Group_with_series
) & {
  _id: string;
} & series;

export type Projects = {
  id: string;
  background: string;
  objects: Object[];
  user: string;
  version: string;
};



export type SocketEmitEvents='room:join'|'room:leave'|'objects'|'objects:modified'|'mouse:move'
export type SocketOnEvents='room:joined'|'room:left'|'objects'|'objects:modified'|'mouse:move'