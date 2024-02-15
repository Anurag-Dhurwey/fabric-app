import { createReducer, on } from '@ngrx/store';
import { setAction, setPenToolStep, Action } from '../actions/state.action';
import { Actions } from '../../../types/app.types';

export type appState = {
  action: Actions;
  penToolStep: number;
};

const initialstate: appState = {
  action: 'select',
  penToolStep: 0,
};

export const appReducer = createReducer(
  initialstate,
  on(setAction, (state, { action }) => ({ ...state, action: action })),
  on(setPenToolStep, (state, { penToolStep }) => ({ ...state, penToolStep }))
);
