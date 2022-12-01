import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {LayerCatalogItem} from '../../../../shared/models/gb3-api.interfaces';

export const LayerCatalogActions = createActionGroup({
  source: 'LayerCatalog',
  events: {
    'Set Layer Catalog': props<{layerCatalogItems: LayerCatalogItem[]}>(),
    'Add Layer Catalog Item': props<{layerCatalogItem: LayerCatalogItem}>(),
    'Clear Layer Catalog': emptyProps()
  }
});
