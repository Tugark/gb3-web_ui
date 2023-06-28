import {createFeature, createReducer, on} from '@ngrx/store';
import {PrintState} from '../states/print.state';
import {PrintActions} from '../actions/print.actions';

export const printFeatureKey = 'print';

export const initialState: PrintState = {
  printInfo: undefined,
  printInfoLoadingState: 'undefined',
  printCreation: undefined,
  printCreationLoadingState: 'undefined',
  printCreationResponse: undefined
};

export const printFeature = createFeature({
  name: printFeatureKey,
  reducer: createReducer(
    initialState,
    on(PrintActions.loadPrintInfo, (state): PrintState => {
      // If we already have infos, we do not reset the state
      if (state.printInfo) {
        return state;
      }
      return {...state, printInfoLoadingState: 'loading'};
    }),
    on(PrintActions.setPrintInfo, (state, {printInfo}): PrintState => {
      return {...state, printInfo, printInfoLoadingState: 'loaded'};
    }),
    on(PrintActions.requestPrintCreation, (state, {printCreation}): PrintState => {
      return {...state, printCreation, printCreationLoadingState: 'loading'};
    }),
    on(PrintActions.setPrintCreationResponse, (state, {printCreationResponse}): PrintState => {
      return {...state, printCreationResponse, printCreationLoadingState: 'loaded'};
    }),
    on(PrintActions.clearPrintCreation, (state): PrintState => {
      return {
        ...state,
        printCreation: initialState.printCreation,
        printCreationResponse: initialState.printCreationResponse,
        printCreationLoadingState: 'undefined'
      };
    })
  )
});

export const {name, reducer, selectPrintInfo, selectPrintInfoLoadingState, selectPrintCreationLoadingState, selectPrintCreationResponse} =
  printFeature;