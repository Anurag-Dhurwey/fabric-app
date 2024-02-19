export type Roles =
  | 'select'
  | 'pen'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'pencil'
  | 'image'
  | 'text';
export type Object = (
  | (fabric.Path & { isPathClosed?: boolean })
  | fabric.Line
  | fabric.Rect
  | fabric.Circle
  | fabric.Image
  | fabric.IText
) & {
  _id: string;
  _type?: 'line' | 'circle' | 'rectangle' | 'pencil' | 'pen' | 'image' | 'text';
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
