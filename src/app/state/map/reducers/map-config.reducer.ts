import {createFeature, createReducer, on} from '@ngrx/store';
import {MapConfigActions} from '../actions/map-config.actions';
import {defaultMapConfig} from '../../../shared/configs/map-config';

export const mapConfigFeatureKey = 'mapConfig';

export interface MapConfigState {
  center: {x: number; y: number};
  scale: number;
  srsId: number;
  ready: boolean;
  scaleSettings: {minScale: number; maxScale: number; calculatedMinScale: number; calculatedMaxScale: number};
  isMaxZoomedIn: boolean;
  isMaxZoomedOut: boolean;
  activeBasemapId: string;
}

export const initialState: MapConfigState = {
  center: defaultMapConfig.center,
  scale: defaultMapConfig.scale,
  srsId: defaultMapConfig.srsId,
  ready: defaultMapConfig.ready,
  scaleSettings: defaultMapConfig.scaleSettings,
  activeBasemapId: defaultMapConfig.activeBasemapId,
  isMaxZoomedIn: defaultMapConfig.isMaxZoomedIn,
  isMaxZoomedOut: defaultMapConfig.isMaxZoomedOut
};

export const mapConfigFeature = createFeature({
  name: mapConfigFeatureKey,
  reducer: createReducer(
    initialState,
    on(MapConfigActions.setInitialMapConfig, (state, {x, y, scale, basemapId}): MapConfigState => {
      const initialExtent = {
        center: {
          x: x ?? initialState.center.x,
          y: y ?? initialState.center.y
        },
        scale: scale ?? initialState.scale
      };
      const activeBasemapId = basemapId ?? initialState.activeBasemapId;

      return {...state, activeBasemapId, ...initialExtent};
    }),
    on(MapConfigActions.setMapExtent, (state, {x, y, scale}): MapConfigState => {
      /**
       * maxZoomedOut: scale is smaller or equal to the calculated max, floored.
       * maxZoomedIn: scale is larger than or equal to the calculated min, ceiled.
       *
       * Flooring/ceiling accounts for rounding and precision differences in the actual scale vs the calculated ones.
       */
      const isMaxZoomedIn = Math.floor(scale) <= state.scaleSettings.calculatedMaxScale;
      const isMaxZoomedOut = Math.ceil(scale) >= state.scaleSettings.calculatedMinScale;
      return {...state, center: {x, y}, scale, isMaxZoomedIn, isMaxZoomedOut};
    }),
    on(MapConfigActions.setReady, (state, {calculatedMinScale, calculatedMaxScale}): MapConfigState => {
      /**
       * Because the calculatedMinScale/calculatedMaxScale can be float values, we round them: minScale is ceiled (as
       * e.g. 100.45 should be 101), maxScale is floored (as 1000.45 should be 1000).
       *
       * The reason for this is that we need to compare the actual scale with the max values to discern whether we are
       * maximally zoomedIn/zoomedOut, but that scale might not reflect the same precision as the calculatedMax/Min
       * values.
       */
      const scaleSettings = structuredClone(state.scaleSettings);
      scaleSettings.calculatedMinScale = Math.floor(calculatedMinScale);
      scaleSettings.calculatedMaxScale = Math.ceil(calculatedMaxScale);

      return {...state, scaleSettings, ready: true};
    }),
    on(MapConfigActions.setScale, (state, {scale}): MapConfigState => {
      return {...state, scale};
    }),
    on(MapConfigActions.resetExtent, (state): MapConfigState => {
      return {...state};
    }),
    on(MapConfigActions.changeZoom, (state, {zoomType}): MapConfigState => {
      return {...state};
    }),
    on(MapConfigActions.setBasemap, (state, {activeBasemapId}): MapConfigState => {
      return {...state, activeBasemapId};
    })
  )
});

export const {
  name,
  reducer,
  selectMapConfigState,
  selectCenter,
  selectScale,
  selectSrsId,
  selectReady,
  selectIsMaxZoomedIn,
  selectIsMaxZoomedOut,
  selectActiveBasemapId
} = mapConfigFeature;