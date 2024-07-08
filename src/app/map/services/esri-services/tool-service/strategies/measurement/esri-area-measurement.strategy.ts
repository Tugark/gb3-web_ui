import * as geometryEngine from '@arcgis/core/geometry/geometryEngine';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {NumberUtils} from '../../../../../../shared/utils/number.utils';
import {AbstractEsriMeasurementStrategy, LabelConfiguration} from '../abstract-esri-measurement.strategy';
import Polygon from '@arcgis/core/geometry/Polygon';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import {SupportedEsriTool} from '../abstract-esri-drawable-tool.strategy';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import Point from '@arcgis/core/geometry/Point';
import {HANDLE_GROUP_KEY} from '../../esri-tool.service';
import {PolygonType} from '../../../../../types/polygon.type';

const M2_TO_KM2_CONVERSION_THRESHOLD = 100_000;

export class EsriAreaMeasurementStrategy extends AbstractEsriMeasurementStrategy<Polygon, DrawingCallbackHandler['completeMeasurement']> {
  protected readonly tool: SupportedEsriTool = 'polygon';
  private readonly labelSymbolization: TextSymbol;
  private labelPosition: Point | undefined;

  constructor(
    layer: GraphicsLayer,
    mapView: MapView,
    polygonSymbol: SimpleFillSymbol,
    labelSymbolization: TextSymbol,
    completeDrawingCallbackHandler: DrawingCallbackHandler['completeMeasurement'],
    polygonType: PolygonType,
  ) {
    super(layer, mapView, completeDrawingCallbackHandler);

    this.tool = polygonType;
    this.sketchViewModel.polygonSymbol = polygonSymbol;
    this.labelSymbolization = labelSymbolization;
    const handle = this.sketchViewModel.view.on('pointer-move', (event) => {
      this.labelPosition = this.sketchViewModel.view.toMap({x: event.x, y: event.y});
    });
    this.sketchViewModel.view.addHandles([handle], HANDLE_GROUP_KEY);
  }

  protected override createLabelConfigurationForGeometry(geometry: Polygon): LabelConfiguration {
    this.labelSymbolization.text = this.getRoundedPolygonAreaString(geometry);

    return {location: this.getLabelPosition(geometry), symbolization: this.labelSymbolization};
  }

  private getLabelPosition(geometry: Polygon): Point {
    if (this.isDrawingFinished) {
      return geometry.centroid;
    }
    return this.labelPosition!;
  }

  /**
   * Returns the area and circumference string of the given polygon, rounded to two decimals and converted to km2 if it is larger than
   * the defined threshold in M2_TO_KM2_CONVERSION_THRESHOLD.
   * @param polygon
   * @private
   */
  private getRoundedPolygonAreaString(polygon: Polygon): string {
    let areaUnit = 'm²';
    let distanceUnit = 'm';
    let area = geometryEngine.planarArea(polygon, 'square-meters');
    let distance = this.tool === 'polygon' ? geometryEngine.planarLength(polygon, 'meters') : Math.sqrt(area / Math.PI);
    const distanceSymbol = this.tool === 'polygon' ? 'U' : 'r';

    if (area > M2_TO_KM2_CONVERSION_THRESHOLD) {
      area = area / 1_000_000;
      distance = distance / 1_000;
      areaUnit = 'km²';
      distanceUnit = 'km';
    }

    return `A: ${NumberUtils.roundToDecimals(area, 2)} ${areaUnit}\n${distanceSymbol}: ${NumberUtils.roundToDecimals(distance, 2)} ${distanceUnit}`;
  }
}
