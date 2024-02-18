import { createReducer, on } from '@ngrx/store';
import { setRole } from '../actions/state.action';
import { Roles } from '../../../types/app.types';

export type appState = {
  action: Roles;
  penToolStep: number;
};

const initialstate: appState = {
  action: 'select',
  penToolStep: 0,
};

export const appReducer = createReducer(
  initialstate,
  on(setRole, (state, { action }) => ({ ...state, action: action })),
);
