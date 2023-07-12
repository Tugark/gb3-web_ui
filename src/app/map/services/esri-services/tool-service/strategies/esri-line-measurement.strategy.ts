import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import Polyline from '@arcgis/core/geometry/Polyline';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {NumberUtils} from '../../../../../shared/utils/number.utils';
import {AbstractEsriMeasurementStrategy, LabelConfiguration, SupportedEsriTool} from './abstract-esri-measurement.strategy';

const M_TO_KM_CONVERSION_THRESHOLD = 10_000;

export class EsriLineMeasurementStrategy extends AbstractEsriMeasurementStrategy<Polyline> {
  protected readonly tool: SupportedEsriTool = 'polyline';
  private readonly labelSymbolization: TextSymbol;

  constructor(
    layer: __esri.GraphicsLayer,
    mapView: __esri.MapView,
    polylineSymbol: __esri.SimpleLineSymbol,
    labelSymbolization: __esri.TextSymbol,
    callbackHandler: () => void
  ) {
    super(layer, mapView, callbackHandler);

    this.sketchViewModel.polylineSymbol = polylineSymbol;
    this.labelSymbolization = labelSymbolization;
  }

  protected override createLabelForGeometry(geometry: Polyline): LabelConfiguration {
    this.labelSymbolization.text = this.getRoundedPolylineLengthString(geometry);
    const lastVertex = geometry.getPoint(0, geometry.paths[0].length - 1);

    return {location: lastVertex, symbolization: this.labelSymbolization};
  }

  private getRoundedPolylineLengthString(polyline: Polyline): string {
    let unit = 'm';
    let length = geometryEngine.planarLength(polyline, 'meters');

    if (length > M_TO_KM_CONVERSION_THRESHOLD) {
      length = length / 1000;
      unit = 'km';
    }

    return `${NumberUtils.roundToDecimals(length, 2)} ${unit}`;
  }
}