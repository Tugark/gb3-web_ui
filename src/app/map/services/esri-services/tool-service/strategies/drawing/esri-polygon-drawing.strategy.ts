import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import MapView from '@arcgis/core/views/MapView';
import {SupportedEsriTool} from '../abstract-esri-drawable-tool.strategy';
import {AbstractEsriDrawingStrategy} from '../abstract-esri-drawing.strategy';
import {DrawingCallbackHandler} from '../../interfaces/drawing-callback-handler.interface';
import {PolygonType} from '../../../../../types/polygon.type';

export class EsriPolygonDrawingStrategy extends AbstractEsriDrawingStrategy<DrawingCallbackHandler['completeDrawing']> {
  protected readonly tool: SupportedEsriTool = 'polygon';

  constructor(
    layer: GraphicsLayer,
    mapView: MapView,
    polygonSymbol: SimpleFillSymbol,
    completeDrawingCallbackHandler: DrawingCallbackHandler['completeDrawing'],
    polygonType: PolygonType,
  ) {
    super(layer, mapView, completeDrawingCallbackHandler);

    this.sketchViewModel.polygonSymbol = polygonSymbol;
    this.tool = polygonType;
  }
}
