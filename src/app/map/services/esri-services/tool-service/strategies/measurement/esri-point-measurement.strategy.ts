import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {AbstractEsriMeasurementStrategy, LabelConfiguration} from '../abstract-esri-measurement.strategy';
import Point from '@arcgis/core/geometry/Point';
import {NumberUtils} from '../../../../../../shared/utils/number.utils';
import {SupportedEsriTool} from '../abstract-esri-drawable-tool.strategy';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import Graphic from '@arcgis/core/Graphic';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {HANDLE_GROUP_KEY} from '../../esri-tool.service';

export class EsriPointMeasurementStrategy extends AbstractEsriMeasurementStrategy<Point, DrawingCallbackHandler['completeMeasurement']> {
  protected readonly tool: SupportedEsriTool = 'point';
  private readonly labelSymbolization: TextSymbol;
  private previousLabel: Graphic | undefined;

  constructor(
    layer: __esri.GraphicsLayer,
    mapView: __esri.MapView,
    pointSymbol: __esri.SimpleMarkerSymbol,
    labelSymbolization: __esri.TextSymbol,
    completeDrawingCallbackHandler: DrawingCallbackHandler['completeMeasurement'],
  ) {
    super(layer, mapView, completeDrawingCallbackHandler);

    this.sketchViewModel.pointSymbol = pointSymbol;
    this.labelSymbolization = labelSymbolization;
    const drawHandle = reactiveUtils.on(
      () => this.sketchViewModel.view,
      'pointer-move',
      (event) => {
        const point = this.sketchViewModel.view.toMap({x: event.x, y: event.y});
        const labelConfiguration = this.createLabelConfigurationForGeometry(point);
        const label = new Graphic({geometry: labelConfiguration.location, symbol: labelConfiguration.symbolization});
        this.cleanup();
        this.layer.add(label);
        this.previousLabel = label;
      },
    );
    this.sketchViewModel.view.addHandles([drawHandle], HANDLE_GROUP_KEY);
  }

  public override cleanup() {
    if (this.previousLabel) {
      this.layer.remove(this.previousLabel);
    }
  }

  protected override createLabelConfigurationForGeometry(geometry: Point): LabelConfiguration {
    this.labelSymbolization.text = this.getCoordinateString(geometry);

    return {location: this.getLabelPosition(geometry), symbolization: this.labelSymbolization};
  }

  private getLabelPosition(geometry: Point): Point {
    return geometry;
  }

  private getCoordinateString(geometry: __esri.Point) {
    return `${NumberUtils.roundToDecimals(geometry.x, 2)}/${NumberUtils.roundToDecimals(geometry.y, 2)}`;
  }
}
