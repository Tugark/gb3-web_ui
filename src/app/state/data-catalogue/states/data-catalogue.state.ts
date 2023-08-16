import {HasLoadingState} from '../../../shared/interfaces/has-loading-state.interface';
import {OverviewMetadataItem} from '../../../shared/models/overview-metadata-item.model';
import {DataCatalogueFilter} from '../../../shared/interfaces/data-catalogue-filter.interface';

export interface DataCatalogueState extends HasLoadingState {
  items: OverviewMetadataItem[];
  filters: DataCatalogueFilter[];
}