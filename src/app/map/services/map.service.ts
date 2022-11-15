import {Injectable} from '@angular/core';
import {EsriGroupLayer, EsriMap, EsriMapView, EsriWMSLayer} from '../../shared/external/esri.module';
import {LayersConfig} from '../../../assets/layers.config';
import {Store} from '@ngrx/store';
import {MapConfigurationActions} from '../../core/state/map/actions/map-configuration.actions';
import {TransformationService} from './transformation.service';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {MapConfigurationState, selectMapConfigurationState} from '../../core/state/map/reducers/map-configuration.reducer';
import {first, tap} from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  constructor(private readonly store: Store, private readonly transformationService: TransformationService) {}

  private _mapView!: __esri.MapView;

  public get mapView(): __esri.MapView {
    return this._mapView;
  }

  public init(): void {
    const groupLayers: __esri.GroupLayer[] = [];
    LayersConfig.forEach((layerConfig) => {
      const uniqueLayers: __esri.Layer[] = [];
      layerConfig.layer.split(',').map((sublayer) => {
        const layer = new EsriWMSLayer({
          id: layerConfig.id,
          url: layerConfig.url,
          sublayers: [{name: sublayer, title: sublayer}],
          description: layerConfig.queryLayerName
        });
        uniqueLayers.push(layer);
      });
      groupLayers.push(
        new EsriGroupLayer({
          layers: uniqueLayers,
          id: layerConfig.name,
          title: layerConfig.queryLayerName
        })
      );
    });

    const map = new EsriMap({basemap: 'hybrid', layers: groupLayers});

    this.store
      .select(selectMapConfigurationState)
      .pipe(
        first(),
        tap((config: MapConfigurationState) => {
          this._mapView = new EsriMapView({
            map: map,
            scale: config.scale,
            center: config.center
          });
          this.attachMapListeners();
        })
      )
      .subscribe();
  }

  public assignMapElement(container: any) {
    this.mapView.container = container;
  }

  private attachMapListeners() {
    reactiveUtils.when(
      () => this.mapView.stationary,
      () => this.updateMapConfiguration()
    );
  }

  private updateMapConfiguration() {
    const {center, scale} = this.mapView;
    const projectedCenter = this.transformationService.transform(center);
    this.store.dispatch(MapConfigurationActions.setMapExtent({center: projectedCenter, scale}));
  }
}
