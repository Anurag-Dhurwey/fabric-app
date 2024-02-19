import { createAction, props } from '@ngrx/store';
import { Roles } from '../../../types/app.types';



export const setRole = createAction(
  '[Action Component] setRole',
  props<{ role: Roles }>()
);

export type setCanvasConfigProp ={ backgroungColor?: string; width?: number; height?: number }
export const setCanvasConfig = createAction(
  '[Action Component] setCanvasConfig',
  props<setCanvasConfigProp>()
);
