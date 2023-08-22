import {Injectable, OnDestroy} from '@angular/core';
import {Store} from '@ngrx/store';
import {MapConfigActions} from '../../../state/map/actions/map-config.actions';
import {TransformationService} from './transformation.service';
import {selectActiveBasemapId, selectMapConfigState} from '../../../state/map/reducers/map-config.reducer';
import {BehaviorSubject, first, pairwise, skip, Subscription, tap, withLatestFrom} from 'rxjs';
import {GeoJSONMapperService} from './geo-json-mapper.service';
import * as dayjs from 'dayjs';
import {MapService} from '../../interfaces/map.service';
import {ActiveMapItem} from '../../models/active-map-item.model';
import {ActiveMapItemActions} from '../../../state/map/actions/active-map-item.actions';
import {LoadingState} from '../../../shared/types/loading-state.type';
import {ViewProcessState} from '../../../shared/types/view-process-state.type';
import {ZoomType} from '../../../shared/types/zoom.type';
import {BasemapConfigService} from '../basemap-config.service';
import {ConfigService} from '../../../shared/services/config.service';
import {selectItems} from '../../../state/map/reducers/active-map-item.reducer';
import esriConfig from '@arcgis/core/config';
import wmsAuthAndUrlOverrideInterceptorFactory from './interceptors/override-wms-url.interceptor';
import {selectIsAuthenticated} from '../../../state/auth/reducers/auth-status.reducer';
import {AuthService} from '../../../auth/auth.service';
import {
  EsriBasemap,
  EsriFeatureLayer,
  EsriGraphic,
  EsriGraphicsLayer,
  EsriLoadStatus,
  EsriMap,
  EsriMapView,
  EsriPoint,
  esriReactiveUtils,
  EsriScaleBar,
  EsriSpatialReference,
  EsriTileInfo,
  EsriWMSLayer,
  EsriWMSSublayer,
} from './esri.module';
import {TimeSliderConfiguration, TimeSliderLayerSource, TimeSliderParameterSource} from '../../../shared/interfaces/topic.interface';
import {TimeExtent} from '../../interfaces/time-extent.interface';
import {MapConfigState} from '../../../state/map/states/map-config.state';
import {GeometryWithSrs, PointWithSrs, PolygonWithSrs} from '../../../shared/interfaces/geojson-types-with-srs.interface';
import {InternalDrawingLayer} from '../../../shared/enums/drawing-layer.enum';
import {EsriSymbolizationService} from './esri-symbolization.service';
import {EsriMapViewService} from './esri-map-view.service';
import {Gb2WmsActiveMapItem} from '../../models/implementations/gb2-wms.model';
import {DrawingActiveMapItem} from '../../models/implementations/drawing.model';
import {EsriToolService} from './tool-service/esri-tool.service';
import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import {PrintUtils} from '../../../shared/utils/print.utils';
import {map} from 'rxjs/operators';

const DEFAULT_POINT_ZOOM_EXTENT_SCALE = 750;
const DEFAULT_PRINT_PREVIEW_ANIMATION_DURATION_IN_MS = 500;
const DEFAULT_PRINT_PREVIEW_EXPAND_FACTOR = 1.5;

@Injectable({
  providedIn: 'root',
})
export class EsriMapService implements MapService, OnDestroy {
  private scaleBar?: __esri.ScaleBar;
  private effectiveMaxZoom = 23;
  private effectiveMinZoom = 0;
  private effectiveMinScale = 0;
  private readonly printPreviewHandle$: BehaviorSubject<IHandle | null> = new BehaviorSubject<IHandle | null>(null);
  private readonly defaultMapConfig: MapConfigState = this.configService.mapConfig.defaultMapConfig;
  private readonly numberOfDrawingLayers = Object.keys(InternalDrawingLayer).length;
  private readonly subscriptions: Subscription = new Subscription();
  private readonly activeBasemapId$ = this.store.select(selectActiveBasemapId);
  private readonly isAuthenticated$ = this.store.select(selectIsAuthenticated);
  private readonly wmsImageFormatMimeType = this.configService.gb2Config.wmsFormatMimeType;
  private readonly internalLayerPrefix = this.configService.mapConfig.internalLayerPrefix;

  constructor(
    private readonly store: Store,
    private readonly transformationService: TransformationService,
    private readonly geoJSONMapperService: GeoJSONMapperService,
    private readonly basemapConfigService: BasemapConfigService,
    private readonly configService: ConfigService,
    private readonly authService: AuthService,
    private readonly esriSymbolizationService: EsriSymbolizationService,
    private readonly esriMapViewService: EsriMapViewService,
    private readonly esriToolService: EsriToolService,
  ) {
    /**
     * Because the GetCapabalities response often sends a non-secure http://wms.zh.ch response, Esri Javascript API fails on https
     * environments to attach the token above if the urls is set to http://wms.zh.ch; because it automatically upgrades insecure links to
     * https to avoid mixed-content. This configuration forces the WMS to be upgraded to https.
     */
    esriConfig.request.httpsDomains?.push('wms.zh.ch');

    this.initializeInterceptors();
    this.initializeSubscriptions();
  }

  private get mapView(): __esri.MapView {
    return this.esriMapViewService.mapView;
  }

  private set mapView(value: __esri.MapView) {
    this.esriMapViewService.mapView = value;
  }

  public moveLayerToTop(mapItem: ActiveMapItem) {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);

    if (esriLayer) {
      this.mapView.map.layers.reorder(esriLayer, this.mapView.map.layers.length - this.numberOfDrawingLayers - 1);
    }
  }

  public setScale(scale: number) {
    this.mapView.scale = scale;
  }

  public handleZoom(zoomType: ZoomType) {
    const currentZoom = Math.floor(this.mapView.zoom);
    switch (zoomType) {
      case 'zoomIn': {
        const zoomTo = currentZoom + 1;
        if (zoomTo <= this.effectiveMaxZoom) {
          this.mapView.zoom = zoomTo;
        }
        break;
      }
      case 'zoomOut': {
        const zoomTo = currentZoom - 1;
        const currentScale = this.mapView.scale;
        // also check for currentscale, because we might be at the lowest zoomlevel, but not yet at the lowest scale
        if (zoomTo >= this.effectiveMinZoom || currentScale <= this.effectiveMinScale) {
          this.mapView.zoom = zoomTo;
        }
      }
    }
  }

  public init(): void {
    this.store
      .select(selectMapConfigState)
      .pipe(
        first(),
        withLatestFrom(this.store.select(selectItems)),
        tap(([config, activeMapItems]) => {
          const {x, y} = config.center;
          const {minScale, maxScale} = config.scaleSettings;
          const {scale, srsId, activeBasemapId} = config;
          const map = this.createMap(activeBasemapId);
          this.setMapView(map, scale, x, y, srsId, minScale, maxScale);
          this.attachMapViewListeners();
          this.addBasemapSubscription();
          this.initDrawingLayers();
          activeMapItems.forEach((mapItem, position) => {
            mapItem.addToMap(this, position);
          });
        }),
      )
      .subscribe();
  }

  public addDrawingLayer(mapItem: DrawingActiveMapItem, position: number) {
    if (this.esriMapViewService.findEsriLayer(mapItem.id)) {
      return;
    }
    const graphicsLayer = new EsriGraphicsLayer({
      id: mapItem.id,
    });

    const index = this.getIndexForPosition(position);
    this.mapView.map.add(graphicsLayer, index);
  }

  public addGb2WmsLayer(mapItem: Gb2WmsActiveMapItem, position: number) {
    if (this.esriMapViewService.findEsriLayer(mapItem.id)) {
      return;
    }

    const esriLayer: __esri.Layer = new EsriWMSLayer({
      id: mapItem.id,
      title: mapItem.title,
      url: mapItem.settings.url,
      visible: mapItem.visible,
      opacity: mapItem.opacity,
      imageFormat: this.wmsImageFormatMimeType,
      sublayers: mapItem.settings.layers
        .map((layer) => {
          return {
            id: layer.id,
            name: layer.layer,
            title: layer.title,
            visible: layer.visible,
          } as __esri.WMSSublayerProperties;
        })
        .reverse(), // reverse the order of the sublayers because the order in the GB3 interfaces (Topic, ActiveMapItem) is inverted to the
      // order of the WMS specifications
    });
    if (mapItem.settings.timeSliderExtent) {
      // apply initial time slider settings
      this.setEsriTimeSliderExtent(mapItem.settings.timeSliderExtent, mapItem, esriLayer);
    }
    this.attachLayerListeners(esriLayer);
    /**
     * `position` is the map/layer position from the state/GUI: lowest position <=> highest visibility
     * `index` is the position inside the Esri layer array. It's inverse to the position from the state/GUI: the lowest index <=> lowest
     * visibility Additionally, there is a number of default layers that must always keep the highest visibility (e.g. highlight layer)
     * independent from the state/GUI layers.
     */
    const index = this.getIndexForPosition(position);
    this.mapView.map.add(esriLayer, index);
  }

  public removeMapItem(id: string) {
    const esriLayer = this.esriMapViewService.findEsriLayer(id);
    if (esriLayer) {
      this.mapView.map.remove(esriLayer);
    }
  }

  public removeAllMapItems() {
    const nonFixedLayers = this.mapView.map.layers.filter((layer) => !layer.id.startsWith(this.internalLayerPrefix));

    this.mapView.map.removeMany(nonFixedLayers.toArray());
  }

  public assignMapElement(container: HTMLDivElement) {
    this.mapView.container = container;
  }

  public assignScaleBarElement(container: HTMLDivElement) {
    if (this.scaleBar) {
      this.scaleBar.container = container;
    } else {
      this.scaleBar = new EsriScaleBar({view: this.mapView, container: container, unit: 'metric'});
    }
  }

  public setOpacity(opacity: number, mapItem: ActiveMapItem): void {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);
    if (esriLayer) {
      esriLayer.opacity = opacity;
    }
  }

  public setVisibility(visible: boolean, mapItem: ActiveMapItem): void {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);
    if (esriLayer) {
      esriLayer.visible = visible;
    }
  }

  public resetExtent() {
    const {
      center: {x, y},
      srsId,
      scale,
    } = this.defaultMapConfig;
    this.mapView.center = new EsriPoint({x: x, y: y, spatialReference: new EsriSpatialReference({wkid: srsId})});
    this.mapView.scale = scale;
  }

  public setSublayerVisibility(visible: boolean, mapItem: ActiveMapItem, layerId: number) {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);
    if (esriLayer && esriLayer instanceof EsriWMSLayer) {
      const esriSubLayer = esriLayer.sublayers.find((sl) => sl.id === layerId);
      if (esriSubLayer) {
        esriSubLayer.visible = visible;
      }
    }
  }

  public setMapCenter(center: PointWithSrs): Promise<never> {
    return this.mapView.goTo({
      center: this.createGeoReferencedPoint(center),
    }) as never;
  }

  public setTimeSliderExtent(timeExtent: TimeExtent, mapItem: Gb2WmsActiveMapItem) {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);

    if (esriLayer) {
      this.setEsriTimeSliderExtent(timeExtent, mapItem, esriLayer);
    }
  }

  public setAttributeFilters(attributeFilterParameters: {name: string; value: string}[], mapItem: Gb2WmsActiveMapItem) {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);
    if (esriLayer && esriLayer instanceof EsriWMSLayer) {
      const customLayerParameters: {[index: string]: string} = esriLayer.customLayerParameters ?? {};
      attributeFilterParameters.forEach((attributeFilterParameter) => {
        customLayerParameters[attributeFilterParameter.name] = attributeFilterParameter.value;
      });
      esriLayer.customLayerParameters = customLayerParameters;
      esriLayer.refresh();
    }
  }

  public reorderMapItem(previousPosition: number, currentPosition: number) {
    /**
     * `position` is the map/layer position from the state/GUI: lowest position <=> highest visibility
     * `index` is the position inside the Esri layer array. It's inverse to the position from the state/GUI: the lowest index <=> lowest
     * visibility. Additionally, there is a number of default layers that must always keep the highest visibility (e.g. highlight layer)
     * independent from the state/GUI layers.
     */
    const previousIndex = this.getNumberOfNonDrawingLayers() - 1 - previousPosition;
    const currentIndex = this.getNumberOfNonDrawingLayers() - 1 - currentPosition;
    this.mapView.map.layers.reorder(this.mapView.map.layers.getItemAt(previousIndex), currentIndex);
  }

  public reorderSublayer(mapItem: ActiveMapItem, previousPosition: number, currentPosition: number) {
    const esriLayer = this.esriMapViewService.findEsriLayer(mapItem.id);
    if (esriLayer && esriLayer instanceof EsriWMSLayer) {
      /**
       * `position` is the map/layer position from the state/GUI: lowest position <=> highest visibility
       * `index` is the position inside the Esri layer array. It's inverse to the position from the state/GUI: the lowest index <=> lowest
       * visibility. Additionally, there is a number of default layers that must always keep the highest visibility (e.g. highlight layer)
       * independent from the state/GUI layers.
       */
      const previousIndex = esriLayer.sublayers.length - 1 - previousPosition;
      const currentIndex = esriLayer.sublayers.length - 1 - currentPosition;
      esriLayer.sublayers.reorder(esriLayer.sublayers.getItemAt(previousIndex), currentIndex);
    }
  }

  public zoomToPoint(point: PointWithSrs, scale: number): Promise<never> {
    return this.mapView.goTo({
      center: this.createGeoReferencedPoint(point),
      scale: scale,
    }) as never;
  }

  public zoomToExtent(geometry: GeometryWithSrs, expandFactor: number = 1, duration?: number): Promise<never> {
    const esriGeometry = this.geoJSONMapperService.fromGeoJSONToEsri(geometry);

    if (esriGeometry instanceof EsriPoint) {
      return this.mapView.goTo(
        {
          center: esriGeometry,
          scale: DEFAULT_POINT_ZOOM_EXTENT_SCALE,
        },
        {duration},
      ) as never;
    }

    return this.mapView.goTo(
      {
        center: esriGeometry.extent.clone().expand(expandFactor),
      },
      {duration},
    ) as never;
  }

  public addGeometryToDrawingLayer(geometry: GeometryWithSrs, drawingLayer: InternalDrawingLayer) {
    const symbolization = this.esriSymbolizationService.createSymbolizationForDrawingLayer(geometry, drawingLayer);
    const esriGeometry = this.geoJSONMapperService.fromGeoJSONToEsri(geometry);
    this.addEsriGeometryToDrawingLayer(esriGeometry, symbolization, drawingLayer);
  }

  public clearDrawingLayer(drawingLayer: InternalDrawingLayer) {
    const layer = this.esriMapViewService.findEsriLayer(this.createDrawingLayerId(drawingLayer));

    if (layer) {
      (layer as __esri.GraphicsLayer).removeAll();
    }
  }

  public getToolService(): EsriToolService {
    return this.esriToolService;
  }

  public async startDrawPrintPreview(extentWidth: number, extentHeight: number, rotation: number): Promise<void> {
    // listen to any map center changes and redraw the print preview area to keep it in the center of the map
    // the old print preview handle gets removed automatically using a subscription that listens to the value changes and removes old
    // handlers
    this.printPreviewHandle$.next(
      esriReactiveUtils.watch(
        () => [this.mapView.center.x, this.mapView.center.y],
        ([x, y]) => {
          // redraw the print preview area if either the x or the y coordinate of the map center changes so that it is always in the center
          this.handlePrintPreview({x, y}, extentWidth, extentHeight, rotation);
        },
      ),
    );

    // draw the new geometry once as it is entirely possible that the map center didn't change yet and then zoom to the geometry.
    const geometryWithSrs: PolygonWithSrs = this.handlePrintPreview(this.mapView.center, extentWidth, extentHeight, rotation);
    await this.zoomToExtent(geometryWithSrs, DEFAULT_PRINT_PREVIEW_EXPAND_FACTOR, DEFAULT_PRINT_PREVIEW_ANIMATION_DURATION_IN_MS);
  }

  public stopDrawPrintPreview() {
    this.printPreviewHandle$.next(null);
    this.clearDrawingLayer(InternalDrawingLayer.PrintPreview);
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  private addEsriGeometryToDrawingLayer(
    esriGeometry: __esri.Geometry,
    esriSymbolization: __esri.Symbol,
    drawingLayer: InternalDrawingLayer,
  ) {
    const graphicItem = new EsriGraphic({geometry: esriGeometry, symbol: esriSymbolization});
    const targetLayer = this.esriMapViewService.findEsriLayer(this.createDrawingLayerId(drawingLayer));
    if (targetLayer) {
      (targetLayer as __esri.GraphicsLayer).add(graphicItem);
    }
  }

  private handlePrintPreview(center: {x: number; y: number}, extentWidth: number, extentHeight: number, rotation: number): PolygonWithSrs {
    const printPreviewArea = PrintUtils.createPrintPreviewArea(center, extentWidth, extentHeight);
    const symbolization = this.esriSymbolizationService.createSymbolizationForDrawingLayer(
      printPreviewArea,
      InternalDrawingLayer.PrintPreview,
    );
    const esriGeometry = this.geoJSONMapperService.fromGeoJSONToEsri(printPreviewArea);
    // negate the rotation as the geometry engine rotates counter-clockwise by default
    const rotatedEsriGeometry = geometryEngine.rotate(esriGeometry, -rotation);

    this.clearDrawingLayer(InternalDrawingLayer.PrintPreview);
    this.addEsriGeometryToDrawingLayer(rotatedEsriGeometry, symbolization, InternalDrawingLayer.PrintPreview);
    return printPreviewArea;
  }

  /**
   * `position` is the map/layer position from the state/GUI: lowest position <=> highest visibility
   * `index` is the position inside the Esri layer array. It's inverse to the position from the state/GUI: the lowest index <=> lowest
   * visibility Additionally, there is a number of default layers that must always keep the highest visibility (e.g. highlight layer)
   * independent from the state/GUI layers.
   */
  private getIndexForPosition(position: number) {
    return this.getNumberOfNonDrawingLayers() - position;
  }

  private initDrawingLayers() {
    Object.values(InternalDrawingLayer).forEach((drawingLayer) => {
      const graphicsLayer = new EsriGraphicsLayer({
        id: this.createDrawingLayerId(drawingLayer),
      });

      this.mapView.map.add(graphicsLayer);
    });
  }

  private createDrawingLayerId(drawingLayer: InternalDrawingLayer): string {
    return `${this.internalLayerPrefix}${drawingLayer}`;
  }

  /**
   * Returns the number of layers without counting DrawingLayers. Used whenever user-provided layers are dealt with in order to exclude the
   * fixed internal DrawingLayers.
   * @private
   */
  private getNumberOfNonDrawingLayers(): number {
    return this.mapView.map.layers.length - this.numberOfDrawingLayers;
  }

  private createGeoReferencedPoint({coordinates, srs}: PointWithSrs): __esri.Point {
    return new EsriPoint({spatialReference: {wkid: srs}, x: coordinates[0], y: coordinates[1]});
  }

  private setEsriTimeSliderExtent(timeExtent: TimeExtent, mapItem: Gb2WmsActiveMapItem, esriLayer: __esri.Layer) {
    if (esriLayer && esriLayer instanceof EsriWMSLayer && mapItem.settings.timeSliderConfiguration) {
      switch (mapItem.settings.timeSliderConfiguration.sourceType) {
        case 'parameter':
          this.applyTimeSliderCustomParameters(esriLayer, timeExtent, mapItem.settings.timeSliderConfiguration);
          break;
        case 'layer':
          this.synchronizeTimeSliderLayers(esriLayer, timeExtent, mapItem);
          break;
      }
      esriLayer.refresh();
    }
  }

  /**
   * Applies the time slider extent to the given layer by using custom WMS parameters.
   *
   * @remarks
   * Those parameters are defined in the corresponding time slider configuration sent by the source server.
   */
  private applyTimeSliderCustomParameters(
    esriLayer: __esri.WMSLayer,
    timeSliderExtent: TimeExtent,
    timeSliderConfiguration: TimeSliderConfiguration,
  ) {
    const timeSliderParameterSource = timeSliderConfiguration.source as TimeSliderParameterSource;
    const dateFormat = timeSliderConfiguration.dateFormat;

    esriLayer.customLayerParameters = esriLayer.customLayerParameters ?? {};
    esriLayer.customLayerParameters[timeSliderParameterSource.startRangeParameter] = dayjs(timeSliderExtent.start).format(dateFormat);
    esriLayer.customLayerParameters[timeSliderParameterSource.endRangeParameter] = dayjs(timeSliderExtent.end).format(dateFormat);
  }

  /**
   * Applies the time slider extent to the given layer by adding/removing the corresponding WMS sub-layers.
   *
   * @remarks
   * Each time slider sub-layer corresponds to a time duration. The time slider is controlling the currently
   * visible data by adding/removing the corresponding sub-layers. However, there are other sub-layers in addition to
   * the time slider specific sub-layers which should not be modified in any way.
   * Therefore, first all time slider specific sub-layers are filtered. And from those only the ones which have a date inside the current
   * time extent are selected to be visible.
   */
  private synchronizeTimeSliderLayers(esriLayer: __esri.WMSLayer, timeSliderExtent: TimeExtent, mapItem: Gb2WmsActiveMapItem) {
    if (!mapItem.settings.timeSliderConfiguration) {
      return;
    }

    const timeSliderConfig = mapItem.settings.timeSliderConfiguration;
    const timeSliderLayerSource = timeSliderConfig.source as TimeSliderLayerSource;
    const timeSliderLayerNames = timeSliderLayerSource.layers.map((l) => l.layerName);
    const timeSliderLayerNamesToShow = timeSliderLayerSource.layers
      .filter((l) => {
        const date = dayjs(l.date, timeSliderConfig.dateFormat).toDate();
        return date >= timeSliderExtent.start && date < timeSliderExtent.end;
      })
      .map((l) => l.layerName);
    // get the layer configs of all time slider specific layers that are  also within the current time extent
    const layers = mapItem.settings.layers.filter((l) => timeSliderLayerNamesToShow.includes(l.layer));
    // include all layers that are not specified in the time slider config
    const esriSublayers = esriLayer.sublayers.filter((sl) => !timeSliderLayerNames.includes(sl.name));
    // now add all layers that are in the time slider config and within the current time extent
    esriSublayers.addMany(
      layers
        .map(
          (layer) =>
            new EsriWMSSublayer({
              id: layer.id,
              name: layer.layer,
              title: layer.title,
              visible: true,
            } as __esri.WMSSublayerProperties),
        )
        .reverse(), // reverse the order of the sublayers because the order in the GB3 interfaces (Topic, ActiveMapItem) is inverted to the
      // order of the WMS specifications
    );
    esriLayer.sublayers = esriSublayers;
  }

  /**
   * We need several interceptors to trick ESRI Javascript API into working with the intricacies of the ZH GB2 configurations.
   * @private
   */
  private initializeInterceptors() {
    this.subscriptions.add(
      this.isAuthenticated$
        .pipe(
          tap(() => {
            const newInterceptor = this.getWmsOverrideInterceptor(this.authService.getAccessToken());
            esriConfig.request.interceptors = []; // todo: pop existing as soon as we add more interceptors
            esriConfig.request.interceptors.push(newInterceptor);
          }),
        )
        .subscribe(),
    );
  }

  private initializeSubscriptions() {
    this.subscriptions.add(
      /**
       * This pipe tracks the active print preview handle changes and automatically destroys old handles properly.
       * Otherwise this could result in potential memory leaks as we could lose the reference to
       * an old (but still active) handle which will be still active in the background forever.
       */
      this.printPreviewHandle$
        .pipe(
          pairwise(),
          map(([previousHandle, activeHandle]) => {
            if (previousHandle) {
              // properly destroy the old handle
              previousHandle.remove();
            }
            return activeHandle;
          }),
        )
        .subscribe(),
    );
  }

  private addBasemapSubscription() {
    this.subscriptions.add(
      this.activeBasemapId$
        .pipe(
          skip(1), // Skip first, because the first is set by init()
          tap((activeBasemapId) => {
            this.switchBasemap(activeBasemapId);
          }),
        )
        .subscribe(),
    );
  }

  private createMap(initialBasemapId: string): __esri.Map {
    return new EsriMap({
      basemap: new EsriBasemap({
        baseLayers: this.basemapConfigService.availableBasemaps.map((baseMap) => {
          switch (baseMap.type) {
            case 'wms':
              return new EsriWMSLayer({
                id: baseMap.id,
                url: baseMap.url,
                title: baseMap.title,
                spatialReference: new EsriSpatialReference({wkid: baseMap.srsId}),
                sublayers: baseMap.layers.map((basemapLayer) => ({name: basemapLayer.name})),
                visible: initialBasemapId === baseMap.id,
                imageFormat: this.wmsImageFormatMimeType,
              });
            case 'blank':
              return new EsriFeatureLayer({
                id: baseMap.id,
                geometryType: 'point', // a feature layer needs a geometry and 'point' is the simplest one
                objectIdField: 'ObjectID', // a feature layer needs this property even if its never used
                title: baseMap.title,
                source: [], // empty source as this is a blank basemap
                spatialReference: new EsriSpatialReference({wkid: this.configService.mapConfig.defaultMapConfig.srsId}),
                visible: initialBasemapId === baseMap.id,
              });
          }
        }),
      }),
    });
  }

  private setMapView(map: __esri.Map, scale: number, x: number, y: number, srsId: number, minScale: number, maxScale: number) {
    const spatialReference = new EsriSpatialReference({wkid: srsId});
    this.mapView = new EsriMapView({
      map: map,
      ui: {
        components: ['attribution'],
      },
      scale: scale,
      center: new EsriPoint({x, y, spatialReference}),
      constraints: {
        rotationEnabled: false,
        snapToZoom: false,
        minScale: minScale,
        maxScale: maxScale,
        lods: EsriTileInfo.create({
          spatialReference,
        }).lods,
      },
    });
  }

  private attachMapViewListeners() {
    esriReactiveUtils.when(
      () => this.mapView.stationary,
      () => this.updateMapConfig(),
    );

    esriReactiveUtils.on(
      () => this.mapView,
      'click',
      (event: __esri.ViewClickEvent) => {
        const {x, y} = this.transformationService.transform(event.mapPoint);
        this.dispatchFeatureInfoRequest(x, y);
      },
    );

    esriReactiveUtils
      .whenOnce(() => this.mapView.ready)
      .then(() => {
        /* eslint-disable @typescript-eslint/no-non-null-assertion */ // at this point, we know the values are ready
        const {effectiveMaxScale, effectiveMinScale, effectiveMaxZoom, effectiveMinZoom} = this.mapView.constraints;

        this.effectiveMaxZoom = effectiveMaxZoom!;
        this.effectiveMinZoom = effectiveMinZoom!;
        this.effectiveMinScale = effectiveMinScale!;

        this.store.dispatch(
          MapConfigActions.setReady({
            calculatedMinScale: effectiveMinScale!,
            calculatedMaxScale: effectiveMaxScale!,
          }),
        );
      });

    esriReactiveUtils.on(
      () => this.mapView,
      'layerview-create',
      (event: __esri.ViewLayerviewCreateEvent) => {
        this.attachLayerViewListeners(event.layerView);
      },
    );
  }

  private attachLayerListeners(esriLayer: __esri.Layer) {
    // watch and initialize the loading state by observing the 'loadStatus' property
    esriReactiveUtils.watch(
      () => esriLayer.loadStatus,
      (loadStatus) => {
        this.updateLoadingState(loadStatus, esriLayer.id);
      },
    );
    this.updateLoadingState(esriLayer.loadStatus, esriLayer.id);
  }

  private attachLayerViewListeners(esriLayerView: __esri.LayerView) {
    // watch and initialize the view process state by observing the 'updating' property
    esriReactiveUtils.watch(
      () => esriLayerView.updating,
      (updating) => {
        this.updateViewProcessState(updating, esriLayerView.layer?.id);
      },
    );
    this.updateViewProcessState(esriLayerView.updating, esriLayerView.layer?.id);
  }

  private updateLoadingState(loadStatus: EsriLoadStatus | undefined, id: string) {
    const loadingState = this.transformLoadStatusToLoadingState(loadStatus);
    this.store.dispatch(ActiveMapItemActions.setLoadingState({loadingState: loadingState, id: id}));
  }

  private updateViewProcessState(updating: boolean | undefined, id: string | undefined) {
    if (id !== undefined) {
      const viewProcessState: ViewProcessState = this.transformUpdatingToViewProcessState(updating);
      this.store.dispatch(ActiveMapItemActions.setViewProcessState({viewProcessState: viewProcessState, id: id}));
    }
  }

  private transformLoadStatusToLoadingState(loadStatus: EsriLoadStatus | undefined): LoadingState {
    if (loadStatus === undefined) {
      return 'undefined';
    }
    switch (loadStatus) {
      case 'not-loaded':
        return 'undefined';
      case 'failed':
        return 'error';
      case 'loading':
        return 'loading';
      case 'loaded':
        return 'loaded';
    }
  }

  private transformUpdatingToViewProcessState(updating: boolean | undefined): ViewProcessState {
    if (updating === undefined) {
      return 'undefined';
    }
    return updating ? 'updating' : 'completed';
  }

  private dispatchFeatureInfoRequest(x: number, y: number) {
    this.store.dispatch(MapConfigActions.handleMapClick({x, y}));
  }

  private updateMapConfig() {
    const {center, scale} = this.mapView;
    const {x, y} = this.transformationService.transform(center);
    this.store.dispatch(MapConfigActions.setMapExtent({x, y, scale}));
  }

  private switchBasemap(basemapId: string) {
    this.mapView.map.basemap.baseLayers.map((baseLayer) => {
      baseLayer.visible = basemapId === baseLayer.id;
    });
  }

  private getWmsOverrideInterceptor(accessToken?: string): __esri.RequestInterceptor {
    const wmsOverrideUrl = this.configService.overridesConfig.overrideWmsUrl;
    const {gb2Wms, gb2WmsCapabilities} = this.configService.apiConfig;
    return wmsAuthAndUrlOverrideInterceptorFactory([gb2Wms.baseUrl, gb2WmsCapabilities.baseUrl], wmsOverrideUrl, accessToken);
  }
}
