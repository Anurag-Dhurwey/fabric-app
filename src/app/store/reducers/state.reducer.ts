import { createReducer, on } from '@ngrx/store';
import { setCanvasConfig, setRole } from '../actions/state.action';
import { Roles } from '../../../types/app.types';
export type CanvasConfig={
  backgroungColor:string
  width:number
  height:number
}
export type appState = {
  role: Roles;
  canvasConfig:CanvasConfig
};

const initialstate: appState = {
  role: 'select',
  canvasConfig:{
    backgroungColor:"#282829",
    width:window.innerWidth,
    height:window.innerHeight
  }
};

export const appReducer = createReducer(
  initialstate,
  on(setRole, (state, { role }) => ({ ...state,role })),
  on(setCanvasConfig, (state, props) => ({ ...state, canvasConfig:{...state.canvasConfig,...props} })),
);
