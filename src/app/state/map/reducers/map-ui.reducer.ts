import {createFeature, createReducer, on} from '@ngrx/store';
import {MapUiState} from '../states/map-ui.state';
import {MapUiActions} from '../actions/map-ui.actions';
import {BottomSheetHeight} from 'src/app/shared/enums/bottom-sheet-heights.enum';

export const mapUiFeatureKey = 'mapUi';

export const initialState: MapUiState = {
  mapSideDrawerContent: 'none',
  hideUiElements: false,
  hideToggleUiElementsButton: false,
  hideZoomButtons: false,
  toolMenuVisibility: undefined,
  bottoSheetOverlayVisibility: false,
  bottomSheetHeight: BottomSheetHeight.medium,
};

export const mapUiFeature = createFeature({
  name: mapUiFeatureKey,
  reducer: createReducer(
    initialState,
    on(MapUiActions.toggleToolMenu, (state, {tool}): MapUiState => {
      return {
        ...state,
        toolMenuVisibility: tool,
      };
    }),
    on(MapUiActions.changeUiElementsVisibility, (state, {hideAllUiElements, hideUiToggleButton}): MapUiState => {
      return {
        ...state, // todo: what needs to be done here for toolmenu?
        mapSideDrawerContent: state.mapSideDrawerContent,
        hideUiElements: hideAllUiElements,
        hideToggleUiElementsButton: hideUiToggleButton,
        hideZoomButtons: hideAllUiElements,
      };
    }),
    on(MapUiActions.showMapSideDrawerContent, (state, {mapSideDrawerContent}): MapUiState => {
      return {
        ...state,
        mapSideDrawerContent: mapSideDrawerContent,
      };
    }),
    on(MapUiActions.hideMapSideDrawerContent, (state): MapUiState => {
      return {
        ...state,
        mapSideDrawerContent: 'none',
      };
    }),
    on(MapUiActions.showBottomSheetOverlay, (state, {bottomSheetHeight}): MapUiState => {
      return {
        ...state,
        bottoSheetOverlayVisibility: true,
        hideUiElements: true,
        bottomSheetHeight: bottomSheetHeight,
      };
    }),
    on(MapUiActions.hideBottomSheetOverlay, (state): MapUiState => {
      return {
        ...state,
        bottoSheetOverlayVisibility: false,
        hideUiElements: false,
      };
    }),
  ),
});

export const {name, reducer, selectMapUiState, selectToolMenuVisibility, selectBottoSheetOverlayVisibility, selectBottomSheetHeight} =
  mapUiFeature;
