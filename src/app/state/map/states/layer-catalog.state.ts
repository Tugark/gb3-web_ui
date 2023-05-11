import {HasLoadingState} from '../../../shared/interfaces/has-loading-state.interface';
import {Topic} from '../../../shared/interfaces/topic.interface';

export interface LayerCatalogState extends HasLoadingState {
  layerCatalogItems: Topic[];
  filterString: string;
}
