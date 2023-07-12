import {Injectable, OnDestroy} from '@angular/core';
import {ToolService} from '../../../interfaces/tool.service';
import {EsriMapViewService} from '../esri-map-view.service';
import {ActiveMapItemActions} from '../../../../state/map/actions/active-map-item.actions';
import {Store} from '@ngrx/store';
import {ActiveMapItemFactory} from '../../../../shared/factories/active-map-item.factory';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {selectDrawingLayers} from '../../../../state/map/selectors/drawing-layers.selector';
import {Subscription, tap} from 'rxjs';
import {EsriToolStrategy} from './interfaces/strategy.interface';
import {EsriDefaultStrategy} from './strategies/esri-default.strategy';
import {EsriLineMeasurementStrategy} from './strategies/esri-line-measurement.strategy';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import {EsriSymbolizationService} from '../esri-symbolization.service';
import {UserDrawingLayer} from '../../../../shared/enums/drawing-layer.enum';
import {DrawingActiveMapItem} from '../../../models/implementations/drawing.model';
import {EsriAreaMeasurementStrategy} from './strategies/esri-area-measurement.strategy';
import {EsriPointMeasurementStrategy} from './strategies/esri-point-measurement.strategy';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import {ToolActions} from '../../../../state/map/actions/tool.actions';
import {MeasurementTool} from '../../../../shared/types/measurement-tool';

@Injectable({
  providedIn: 'root'
})
export class EsriToolService implements ToolService, OnDestroy {
  private toolStrategy: EsriToolStrategy = new EsriDefaultStrategy();
  private drawingLayers: DrawingActiveMapItem[] = [];
  private readonly drawingLayers$ = this.store.select(selectDrawingLayers);
  private readonly subscriptions: Subscription = new Subscription();

  constructor(
    private readonly esriMapViewService: EsriMapViewService,
    private readonly store: Store,
    private readonly esriSymbolizationService: EsriSymbolizationService
  ) {
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  public cancelMeasurement() {
    this.toolStrategy.cancel();
  }

  public startMeasurement(measurementTool: MeasurementTool): void {
    const drawingLayer = this.esriMapViewService.findEsriLayer(UserDrawingLayer.Measurements);

    if (!drawingLayer) {
      /**
       * In case we don't have a drawing layer yet, we add it to the map. However, because this is not done immediately, we need a one-off
       * listener to this layer in order to then start the drawing functionality when the layer is effectively added. Starting the drawing
       * immediately after dispatching the layer addition will yield undefined errors.
       */
      reactiveUtils
        .once(() => this.esriMapViewService.findEsriLayer(UserDrawingLayer.Measurements))
        .then((layer) => {
          this.setMeasurementStrategy(measurementTool, layer as GraphicsLayer);
          this.startDrawing();
        });

      const drawingLayerAdd = ActiveMapItemFactory.createDrawingMapItem();
      this.store.dispatch(ActiveMapItemActions.addActiveMapItem({activeMapItem: drawingLayerAdd, position: 0}));
    } else {
      this.forceVisibility();
      this.setMeasurementStrategy(measurementTool, drawingLayer as GraphicsLayer);
      this.startDrawing();
    }
  }

  private initSubscriptions() {
    this.subscriptions.add(this.drawingLayers$.pipe(tap((drawingLayers) => (this.drawingLayers = drawingLayers))).subscribe());
  }

  private startDrawing() {
    this.toolStrategy.start();
  }

  private endDrawing() {
    this.store.dispatch(ToolActions.deactivateTool());
  }

  /**
   * Forces the drawing layer to become visible to prevent users from measuring on transparent or invisible drawing layers.
   * @private
   */
  private forceVisibility() {
    // todo: refactor to array once we have more to avoid non-null assertion
    const activeMapItem = this.drawingLayers.find((l) => l.id === UserDrawingLayer.Measurements)!;

    this.store.dispatch(ActiveMapItemActions.forceFullVisibility({activeMapItem}));
  }

  private setMeasurementStrategy(measurementType: MeasurementTool, layer: GraphicsLayer) {
    const pointStyle = this.esriSymbolizationService.createPointSymbolization(UserDrawingLayer.Measurements) as SimpleMarkerSymbol;
    const lineStyle = this.esriSymbolizationService.createLineSymbolization(UserDrawingLayer.Measurements);
    const areaStyle = this.esriSymbolizationService.createPolygonSymbolization(UserDrawingLayer.Measurements);
    const labelStyle = this.esriSymbolizationService.createTextSymbolization(UserDrawingLayer.Measurements);

    switch (measurementType) {
      case 'measure-area':
        this.toolStrategy = new EsriAreaMeasurementStrategy(layer, this.esriMapViewService.mapView, areaStyle, labelStyle, () =>
          this.endDrawing()
        );
        break;
      case 'measure-line':
        this.toolStrategy = new EsriLineMeasurementStrategy(layer, this.esriMapViewService.mapView, lineStyle, labelStyle, () =>
          this.endDrawing()
        );
        break;
      case 'measure-point':
        this.toolStrategy = new EsriPointMeasurementStrategy(layer, this.esriMapViewService.mapView, pointStyle, labelStyle, () =>
          this.endDrawing()
        );
    }
  }
}