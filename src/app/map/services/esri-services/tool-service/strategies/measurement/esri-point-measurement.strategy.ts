import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {AbstractEsriMeasurementStrategy, LabelConfiguration} from '../abstract-esri-measurement.strategy';
import Point from '@arcgis/core/geometry/Point';
import {NumberUtils} from '../../../../../../shared/utils/number.utils';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import Graphic from '@arcgis/core/Graphic';
import {SupportedEsriTool} from '../supported-esri-tool.type';
import {MeasurementConstants} from '../../../../../../shared/constants/measurement.constants';

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
    this.labelDisplacementY = MeasurementConstants.LABEL_DISPLACEMENT[this.tool].y;
    this.labelDisplacementX = MeasurementConstants.LABEL_DISPLACEMENT[this.tool].x;
  }

  protected override handlePointerMove(event: __esri.ViewPointerMoveEvent) {
    this.labelPosition = this.sketchViewModel.view.toMap({x: event.x, y: event.y - this.labelDisplacementY});
    const labelConfiguration = this.createLabelConfigurationForGeometry(this.labelPosition);
    const label = new Graphic({geometry: labelConfiguration.location, symbol: labelConfiguration.symbolization});
    this.removePreviousLabel();
    this.layer.add(label);
    this.previousLabel = label;
  }

  protected override createLabelConfigurationForGeometry(geometry: Point): LabelConfiguration {
    this.labelSymbolization.text = this.getCoordinateString(geometry);

    return {location: this.labelPosition!, symbolization: this.labelSymbolization};
  }

  private getCoordinateString(geometry: __esri.Point) {
    return `${NumberUtils.roundToDecimals(geometry.x, 2)}/${NumberUtils.roundToDecimals(geometry.y, 2)}`;
  }
}
