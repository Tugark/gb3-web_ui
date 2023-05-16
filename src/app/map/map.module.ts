import {NgModule} from '@angular/core';
import {CommonModule} from '@angular/common';
import {MapComponent} from './components/map/map.component';
import {SharedModule} from '../shared/shared.module';
import {ActiveMapItemsComponent} from './components/active-map-items/active-map-items.component';
import {MapPageComponent} from './map-page.component';
import {MapRoutingModule} from './map-routing.module';
import {LegendOverlayComponent} from './components/legend-overlay/legend-overlay.component';
import {LegendItemComponent} from './components/legend-overlay/legend-item/legend-item.component';
import {FeatureInfoOverlayComponent} from './components/feature-info-overlay/feature-info-overlay.component';
import {MapDataCatalogueComponent} from './components/map-data-catalogue/map-data-catalogue.component';
import {MapOverlayComponent} from './components/map/map-overlay/map-overlay.component';
import {MapOverlayListItemComponent} from './components/map/map-overlay/map-overlay-list-item/map-overlay-list-item.component';
import {FeatureInfoItemComponent} from './components/feature-info-overlay/feature-info-item/feature-info-item.component';
import {PrintOverlayComponent} from './components/print-overlay/print-overlay.component';
import {PrintDispatcherComponent} from './components/print-overlay/print-dispatcher/print-dispatcher.component';
import {CoordinateScaleInputsComponent} from './components/map/coordinate-scale-inputs/coordinate-scale-inputs.component';
import {MapControlsComponent} from './components/map/map-controls/map-controls.component';
import {BasemapSelectorComponent} from './components/map/basemap-selector/basemap-selector.component';
import {ActiveMapItemComponent} from './components/active-map-items/active-map-item/active-map-item.component';
import {OnboardingGuideModule} from '../onboarding-guide/onboarding-guide.module';
import {MapAttributeFilterComponent} from './components/map-attribute-filter/map-attribute-filter.component';
import {FavouriteCreationDialogComponent} from './components/favourite-creation-dialog/favourite-creation-dialog.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ApiDialogWrapperComponent} from './components/api-dialog-wrapper/api-dialog-wrapper.component';
import {FavouriteDeletionDialogComponent} from './components/favourite-deletion-dialog/favourite-deletion-dialog.component';
import {SearchWindowComponent} from './components/search-window/search-window.component';
import {KtZhDesignSystemModule} from '../kt-zh-design-system/kt-zh-design-system.module';
import {TimeSliderComponent} from './components/time-slider/time-slider.component';
import {LegendContentComponent} from './components/legend-overlay/legend-content/legend-content.component';
import {FeatureInfoContentComponent} from './components/feature-info-overlay/feature-info-content/feature-info-content.component';
import {ResultGroupsComponent} from './components/search-window/result-groups/result-groups.component';
import {ResultGroupComponent} from './components/search-window/result-groups/result-group/result-group.component';
import {ActiveMapItemHeaderComponent} from './components/active-map-items/active-map-item-header/active-map-item-header.component';
import {ActiveMapItemSettingsComponent} from './components/active-map-items/active-map-item-settings/active-map-item-settings.component';
import {ActiveMapItemLayersComponent} from './components/active-map-items/active-map-item-layers/active-map-item-layers.component';
import {ActiveMapItemLayerComponent} from './components/active-map-items/active-map-item-layers/active-map-item-layer/active-map-item-layer.component';
import {FeatureInfoPrintContentComponent} from './components/feature-info-overlay/feature-info-print-content/feature-info-print-content.component';
import {TableColumnIdentifierDirective} from './components/feature-info-overlay/feature-info-content/table-column-identifier.directive';
import {BaseMapDataItemComponent} from './components/map-data-catalogue/base-map-data-item/base-map-data-item.component';
import {MapDataItemMapComponent} from './components/map-data-catalogue/base-map-data-item/map-data-item-map.component';
import {MapDataItemFavouriteComponent} from './components/map-data-catalogue/base-map-data-item/map-data-item-favourite.component';
import {MapDataItemMapLayerComponent} from './components/map-data-catalogue/map-data-item-map-layer/map-data-item-map-layer.component';
import {MapDataItemHeaderComponent} from './components/map-data-catalogue/map-data-item-header/map-data-item-header.component';
import {DataInputComponent} from './components/map/data-input/data-input.component';

@NgModule({
  declarations: [
    MapPageComponent,
    MapComponent,
    ActiveMapItemsComponent,
    ActiveMapItemComponent,
    LegendOverlayComponent,
    LegendItemComponent,
    FeatureInfoOverlayComponent,
    MapOverlayComponent,
    MapDataCatalogueComponent,
    MapOverlayListItemComponent,
    FeatureInfoItemComponent,
    PrintOverlayComponent,
    PrintDispatcherComponent,
    CoordinateScaleInputsComponent,
    MapControlsComponent,
    BasemapSelectorComponent,
    MapAttributeFilterComponent,
    SearchWindowComponent,
    FavouriteCreationDialogComponent,
    ApiDialogWrapperComponent,
    FavouriteDeletionDialogComponent,
    TimeSliderComponent,
    LegendContentComponent,
    FeatureInfoContentComponent,
    ResultGroupsComponent,
    ResultGroupComponent,
    ActiveMapItemHeaderComponent,
    ActiveMapItemSettingsComponent,
    ActiveMapItemLayersComponent,
    ActiveMapItemLayerComponent,
    FeatureInfoContentComponent,
    FeatureInfoPrintContentComponent,
    TableColumnIdentifierDirective,
    BaseMapDataItemComponent,
    MapDataItemMapComponent,
    MapDataItemFavouriteComponent,
    MapDataItemMapLayerComponent,
    MapDataItemHeaderComponent,
    DataInputComponent
  ],
  imports: [CommonModule, SharedModule, MapRoutingModule, OnboardingGuideModule, FormsModule, ReactiveFormsModule, KtZhDesignSystemModule]
})
export class MapModule {}
