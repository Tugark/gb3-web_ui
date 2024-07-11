import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import Polyline from '@arcgis/core/geometry/Polyline';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {NumberUtils} from '../../../../../../shared/utils/number.utils';
import {AbstractEsriMeasurementStrategy, LabelConfiguration} from '../abstract-esri-measurement.strategy';
import {SupportedEsriTool} from '../abstract-esri-drawable-tool.strategy';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import Point from '@arcgis/core/geometry/Point';

const M_TO_KM_CONVERSION_THRESHOLD = 10_000;
// Used to displace the label from the cursor while drawing. Values are in pixels and are added to the cursor position for label positioning
const LABEL_DISPLACEMENT_Y = 15;

export class EsriLineMeasurementStrategy extends AbstractEsriMeasurementStrategy<Polyline, DrawingCallbackHandler['completeMeasurement']> {
  protected readonly tool: SupportedEsriTool = 'polyline';
  private readonly labelSymbolization: TextSymbol;

  constructor(
    layer: __esri.GraphicsLayer,
    mapView: __esri.MapView,
    polylineSymbol: __esri.SimpleLineSymbol,
    labelSymbolization: __esri.TextSymbol,
    completeDrawingCallbackHandler: DrawingCallbackHandler['completeMeasurement'],
  ) {
    super(layer, mapView, completeDrawingCallbackHandler);

    this.sketchViewModel.polylineSymbol = polylineSymbol;
    this.labelSymbolization = labelSymbolization;
  }

  protected override createLabelConfigurationForGeometry(geometry: Polyline): LabelConfiguration {
    this.labelSymbolization.text = this.getRoundedPolylineLengthString(geometry);
    const lastVertex = this.getLabelPosition(geometry);

    return {location: lastVertex, symbolization: this.labelSymbolization};
  }

  private getLabelPosition(geometry: Polyline): Point {
    const lastPoint = geometry.getPoint(0, geometry.paths[0].length - 1);
    const screenCoords = this.sketchViewModel.view.toScreen(lastPoint);
    return this.sketchViewModel.view.toMap({x: screenCoords.x, y: screenCoords.y - LABEL_DISPLACEMENT_Y});
  }

  private getRoundedPolylineLengthString(polyline: Polyline): string {
    let unit = 'm';
    let length = geometryEngine.planarLength(polyline, 'meters');

    if (length > M_TO_KM_CONVERSION_THRESHOLD) {
      length = length / 1000;
      unit = 'km';
    }

    return `l: ${NumberUtils.roundToDecimals(length, 2)} ${unit}`;
  }
}
