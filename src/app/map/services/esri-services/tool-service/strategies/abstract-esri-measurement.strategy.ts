import MapView from '@arcgis/core/views/MapView';
import GraphicsLayer from '@arcgis/core/layers/GraphicsLayer';
import Polygon from '@arcgis/core/geometry/Polygon';
import Graphic from '@arcgis/core/Graphic';
import Polyline from '@arcgis/core/geometry/Polyline';
import Point from '@arcgis/core/geometry/Point';
import TextSymbol from '@arcgis/core/symbols/TextSymbol';
import {AbstractEsriDrawableToolStrategy} from './abstract-esri-drawable-tool.strategy';
import {DrawingCallbackHandler} from '../interfaces/drawing-callback-handler.interface';
import {UserDrawingLayer} from '../../../../../shared/enums/drawing-layer.enum';

export type LabelConfiguration = {location: Point; symbolization: TextSymbol};

export abstract class AbstractEsriMeasurementStrategy<
  TGeometry extends Polygon | Polyline | Point,
  TDrawingCallbackHandler extends DrawingCallbackHandler['completeMeasurement'],
> extends AbstractEsriDrawableToolStrategy<TDrawingCallbackHandler> {
  public readonly internalLayerType: UserDrawingLayer = UserDrawingLayer.Measurements;

  protected constructor(layer: GraphicsLayer, mapView: MapView, completeDrawingCallbackHandler: TDrawingCallbackHandler) {
    super(layer, mapView, completeDrawingCallbackHandler);
  }

  public start(): void {
    let previousLabel: Graphic | undefined;
    this.sketchViewModel.create(this.tool, {mode: 'click'});
    this.sketchViewModel.on('create', ({state, graphic}) => {
      let labelConfiguration: {label: Graphic; labelText: string};
      switch (state) {
        case 'start':
          break; // currently, these events do not trigger any action
        case 'cancel':
          if (previousLabel) {
            this.layer.remove(previousLabel);
          }
          break;
        case 'active':
          previousLabel = this.addLabelToLayer(graphic, previousLabel).label;
          break;
        case 'complete':
          labelConfiguration = this.addLabelToLayer(graphic);
          this.completeDrawingCallbackHandler(graphic, labelConfiguration.label, labelConfiguration.labelText);
          break;
      }
    });
  }

  /**
   * Creates a label for a given geometry and returns the location and the symbolization as a TextSymbol. The labeltext ist container
   * within the symbolization.
   * @param geometry
   * @protected
   */
  protected abstract createLabelConfigurationForGeometry(geometry: TGeometry): LabelConfiguration;

  protected createLabelForGeometry(geometry: TGeometry, belongsToGraphic: string): {label: Graphic; labelText: string} {
    const {location, symbolization} = this.createLabelConfigurationForGeometry(geometry);
    const label = new Graphic({
      geometry: location,
      symbol: symbolization,
    });

    this.setIdentifierOnGraphic(label);
    this.setLabelTextAttributeOnGraphic(label, symbolization.text);
    this.setBelongsToAttributeOnGraphic(label, belongsToGraphic);

    return {label, labelText: symbolization.text};
  }

  private addLabelToLayer(graphic: Graphic, previousLabel?: Graphic | undefined): {label: Graphic; labelText: string} {
    const graphicIdentifier = this.setAndGetIdentifierOnGraphic(graphic);
    const labelConfiguration = this.createLabelForGeometry(graphic.geometry as TGeometry, graphicIdentifier);
    if (previousLabel) {
      this.layer.remove(previousLabel);
    }
    this.layer.add(labelConfiguration.label);
    return labelConfiguration;
  }
}
