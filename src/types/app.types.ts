export type Actions =
  | 'select'
  | 'pen'
  | 'line'
  | 'circle'
  | 'rectangle'
  | 'pencil';
export type Object = (
  | (fabric.Path & { isPathClosed?: boolean })
  | fabric.Line
  | fabric.Rect
  | fabric.Circle
) & { _id: string; _type?: 'line' | 'circle' | 'rectangle' | 'pencil' | 'pen' };

export type Position={x:number,y:number}
export type Presense={ id: string; mouse: Position; expire: number }