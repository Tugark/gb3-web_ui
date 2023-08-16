import {createActionGroup, props} from '@ngrx/store';

export const AuthStatusActions = createActionGroup({
  source: 'AuthStatus',
  events: {
    'Set Status': props<{isAuthenticated: boolean; userName?: string}>(),
    'Perform Logout': props<{forced: boolean}>(),
  },
});
