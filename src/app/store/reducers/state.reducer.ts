import { createReducer, on } from '@ngrx/store';
import { setAction, Action } from '../actions/state.action';
import { Actions } from '../../../types/app.types';

export type appState={
    action?:Actions
}

const initialstate:appState ={
    action:"select"
};


export const appReducer = createReducer(
  initialstate,
  on(setAction, (state, { action }) => ({action}))
);
