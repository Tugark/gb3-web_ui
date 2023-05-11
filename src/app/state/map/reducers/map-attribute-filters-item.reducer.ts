import {createFeature, createReducer, on} from '@ngrx/store';
import {MapAttributeFiltersItemActions} from '../actions/map-attribute-filters-item.actions';
import {MapAttributeFiltersItemState} from '../states/map-attribute-filters-item.state';

export const mapAttributeFiltersItemFeatureKey = 'mapAttributeFiltersItem';

export const initialState: MapAttributeFiltersItemState = {
  mapAttributeFiltersItemId: undefined
};

export const mapAttributeFiltersItemFeature = createFeature({
  name: mapAttributeFiltersItemFeatureKey,
  reducer: createReducer(
    initialState,
    on(MapAttributeFiltersItemActions.setMapAttributeFiltersItemId, (state, {id}): MapAttributeFiltersItemState => {
      return {...initialState, mapAttributeFiltersItemId: id};
    }),
    on(MapAttributeFiltersItemActions.clearMapAttributeFiltersItemId, (): MapAttributeFiltersItemState => {
      return {...initialState};
    })
  )
});

export const {name, reducer, selectMapAttributeFiltersItemState, selectMapAttributeFiltersItemId} = mapAttributeFiltersItemFeature;
