import {createFeature, createReducer, on} from '@ngrx/store';
import {MapUiState} from '../states/map-ui.state';
import {MapUiActions} from '../actions/map-ui.actions';
import {BottomSheetHeight} from 'src/app/shared/enums/bottom-sheet-heights.enum';

export const mapUiFeatureKey = 'mapUi';

export const initialState: MapUiState = {
  mapSideDrawerContent: 'none',
  isLegendOverlayVisible: false,
  isFeatureInfoOverlayVisible: false,
  hideUiElements: false,
  hideToggleUiElementsButton: false,
  hideZoomButtons: false,
  toolMenuVisibility: undefined,
  bottomSheetHeight: BottomSheetHeight.medium,
  showBasemapSelector: false,
  showMapManagementMobile: false,
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
    on(MapUiActions.setLegendOverlayVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isLegendOverlayVisible: isVisible,
      };
    }),
    on(MapUiActions.setFeatureInfoVisibility, (state, {isVisible}): MapUiState => {
      return {
        ...state,
        isFeatureInfoOverlayVisible: isVisible,
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
    on(MapUiActions.setBottomSheetHeight, (state, {bottomSheetHeight}): MapUiState => {
      return {
        ...state,
        bottomSheetHeight: bottomSheetHeight,
      };
    }),
    on(MapUiActions.showBasemapSelectorMobile, (state): MapUiState => {
      return {
        ...state,
        showBasemapSelector: true,
        hideUiElements: true,
      };
    }),
    on(MapUiActions.hideBasemapSelectorMobile, (state): MapUiState => {
      return {
        ...state,
        showBasemapSelector: false,
        hideUiElements: false,
      };
    }),
    on(MapUiActions.showMapManagementMobile, (state): MapUiState => {
      return {
        ...state,
        showMapManagementMobile: true,
        hideUiElements: true,
      };
    }),
    on(MapUiActions.hideMapManagementMobile, (state): MapUiState => {
      return {
        ...state,
        showMapManagementMobile: false,
        hideUiElements: false,
      };
    }),
    on(MapUiActions.hideUiElements, (state): MapUiState => {
      return {
        ...state,
        hideUiElements: true,
      };
    }),
  ),
});

export const {
  name,
  reducer,
  selectMapUiState,
  selectToolMenuVisibility,
  selectIsLegendOverlayVisible,
  selectIsFeatureInfoOverlayVisible,
  selectBottomSheetHeight,
  selectShowBasemapSelector,
  selectShowMapManagementMobile,
} = mapUiFeature;
