import { createAction, props } from '@ngrx/store';
import { Roles } from '../../../types/app.types';

export const setRole = createAction('[Action Component] SetAction',props<{action:Roles}>());