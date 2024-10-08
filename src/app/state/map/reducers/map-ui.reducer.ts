import {createFeature, createReducer, on} from '@ngrx/store';
import {MapUiActions} from '../actions/map-ui.actions';
import {MapUiState} from '../states/map-ui.state';

export const mapUiFeatureKey = 'mapUi';

export const initialState: MapUiState = {
  mapSideDrawerContent: 'none',
  isLegendOverlayVisible: false,
  isFeatureInfoOverlayVisible: false,
  isElevationProfileOverlayVisible: false,
  isAttributeFilterOverlayVisible: false,
  isDrawingEditOverlayVisible: false,
  isMapSideDrawerOpen: false,
  hideUiElements: false,
  hideToggleUiElementsButton: false,
  hideZoomButtons: false,
  toolMenuVisibility: undefined,
  bottomSheetContent: 'none',
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
    on(MapUiActions.setElevationProfileOverlayVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isElevationProfileOverlayVisible: isVisible,
      };
    }),
    on(MapUiActions.setLegendOverlayVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isLegendOverlayVisible: isVisible,
        bottomSheetContent: isVisible ? 'legend' : 'none',
      };
    }),
    on(MapUiActions.setFeatureInfoVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isFeatureInfoOverlayVisible: isVisible,
        bottomSheetContent: isVisible ? 'feature-info' : 'none',
      };
    }),
    on(MapUiActions.setAttributeFilterVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isAttributeFilterOverlayVisible: isVisible,
        bottomSheetContent: isVisible ? 'map-attributes' : 'none',
      };
    }),
    on(MapUiActions.setDrawingEditOverlayVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isDrawingEditOverlayVisible: isVisible,
      };
    }),
    on(MapUiActions.changeUiElementsVisibility, (state, {hideAllUiElements, hideUiToggleButton}): MapUiState => {
      return {
        ...state, // todo: what needs to be done here for toolmenu?
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
        isMapSideDrawerOpen: false,
      };
    }),
    on(MapUiActions.showBottomSheet, (state, {bottomSheetContent}): MapUiState => {
      return {
        ...state,
        bottomSheetContent: bottomSheetContent,
        hideUiElements: true,
      };
    }),
    on(MapUiActions.hideBottomSheet, (state): MapUiState => {
      return {
        ...state,
        bottomSheetContent: 'none',
        hideUiElements: false,
      };
    }),
    on(MapUiActions.notifyMapSideDrawerAfterOpen, (state): MapUiState => {
      return {...state, isMapSideDrawerOpen: true};
    }),
    on(MapUiActions.resetMapUiState, (): MapUiState => {
      return {...initialState};
    }),
  ),
});

export const {
  name,
  reducer,
  selectMapUiState,
  selectToolMenuVisibility,
  selectIsElevationProfileOverlayVisible,
  selectIsLegendOverlayVisible,
  selectIsFeatureInfoOverlayVisible,
  selectIsAttributeFilterOverlayVisible,
  selectIsDrawingEditOverlayVisible,
  selectBottomSheetContent,
  selectHideUiElements,
  selectHideToggleUiElementsButton,
  selectMapSideDrawerContent,
  selectIsMapSideDrawerOpen,
} = mapUiFeature;
