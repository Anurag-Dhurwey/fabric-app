import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideState, provideStore } from '@ngrx/store';
import { appReducer } from './store/reducers/state.reducer';

export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes), provideStore(),provideState("app",  appReducer)]
};
