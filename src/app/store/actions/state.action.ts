import { createAction, props } from '@ngrx/store';
import { Actions } from '../../../types/app.types';

export const Action = createAction('[Action Component] Action');
export const setAction = createAction('[Action Component] SetAction',props<{action:Actions}>());
// export const reset = createAction('[Counter Component] Reset');