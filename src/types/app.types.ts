export type Roles =
  | 'select'
  | 'pen'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'pencil'
  | 'image'
  | 'text';

export type Group = fabric.Group & { _objects: Object[]; type: 'group' };

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
export type TextArea = {
  position: Position | null;
  value: string;
};

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
