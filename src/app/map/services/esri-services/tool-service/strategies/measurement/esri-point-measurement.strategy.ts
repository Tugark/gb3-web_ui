import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {AbstractEsriMeasurementStrategy, LabelConfiguration} from '../abstract-esri-measurement.strategy';
import Point from '@arcgis/core/geometry/Point';
import {NumberUtils} from '../../../../../../shared/utils/number.utils';
import {SupportedEsriTool} from '../abstract-esri-drawable-tool.strategy';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import Graphic from '@arcgis/core/Graphic';
import {HANDLE_GROUP_KEY} from '../../esri-tool.service';

export class EsriPointMeasurementStrategy extends AbstractEsriMeasurementStrategy<Point, DrawingCallbackHandler['completeMeasurement']> {
  protected readonly tool: SupportedEsriTool = 'point';
  private readonly labelSymbolization: TextSymbol;

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
    let previousLabel: Graphic | undefined = undefined;
    const handle = this.sketchViewModel.view.on('pointer-move', (event) => {
      const point = this.sketchViewModel.view.toMap({x: event.x, y: event.y});
      const labelConfiguration = this.createLabelConfigurationForGeometry(point);
      const label = new Graphic({geometry: labelConfiguration.location, symbol: labelConfiguration.symbolization});
      if (previousLabel) {
        this.layer.remove(previousLabel);
      }
      this.layer.add(label);
      previousLabel = label;
    });
    this.sketchViewModel.view.addHandles([handle], HANDLE_GROUP_KEY);
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
