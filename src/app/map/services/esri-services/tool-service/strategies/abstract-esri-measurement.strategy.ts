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
import {HANDLE_GROUP_KEY} from '../esri-tool.service';
import * as reactiveUtils from '@arcgis/core/core/reactiveUtils';
import {MeasurementConstants} from '../../../../../shared/constants/measurement.constants';

export type LabelConfiguration = {location: Point; symbolization: TextSymbol};

export abstract class AbstractEsriMeasurementStrategy<
  TGeometry extends Polygon | Polyline | Point,
  TDrawingCallbackHandler extends DrawingCallbackHandler['completeMeasurement'],
> extends AbstractEsriDrawableToolStrategy<TDrawingCallbackHandler> {
  public labelPosition: Point | undefined;
  public previousLabel: Graphic | undefined;
  public readonly labelDisplacementY: number = MeasurementConstants.LABEL_DISPLACEMENT.default.y;
  public readonly labelDisplacementX: number = MeasurementConstants.LABEL_DISPLACEMENT.default.x;
  public readonly internalLayerType: UserDrawingLayer = UserDrawingLayer.Measurements;
  protected isDrawingFinished = false;

  protected constructor(layer: GraphicsLayer, mapView: MapView, completeDrawingCallbackHandler: TDrawingCallbackHandler) {
    super(layer, mapView, completeDrawingCallbackHandler);
  }

  public start(): void {
    const drawHandle = reactiveUtils.on(
      () => this.sketchViewModel.view,
      'pointer-move',
      (event) => {
        this.handlePointerMove(event);
      },
    );
    this.sketchViewModel.view.addHandles([drawHandle], HANDLE_GROUP_KEY);
    this.sketchViewModel.create(this.tool, {mode: 'click'});
    reactiveUtils.on(
      () => this.sketchViewModel,
      'create',
      ({state, graphic}) => {
        let labelConfiguration: {label: Graphic; labelText: string};
        switch (state) {
          case 'start':
            break; // currently, this event does not trigger any action
          case 'cancel':
            this.cleanup();
            this.sketchViewModel.view.removeHandles(HANDLE_GROUP_KEY);
            break;
          case 'active':
            this.previousLabel = this.addLabelToLayer(graphic).label;
            break;
          case 'complete':
            this.isDrawingFinished = true;
            this.cleanup();
            labelConfiguration = this.addLabelToLayer(graphic);
            this.completeDrawingCallbackHandler(graphic, labelConfiguration.label, labelConfiguration.labelText);
            break;
        }
      },
    );
  }

  protected handlePointerMove(event: __esri.ViewPointerMoveEvent): void {
    this.labelPosition = this.sketchViewModel.view.toMap({x: event.x + this.labelDisplacementX, y: event.y - this.labelDisplacementY});
  }

  public cleanup(): void {
    if (this.previousLabel) {
      this.layer.remove(this.previousLabel);
    }
  }

  public addLabelToLayer(graphic: Graphic): {label: Graphic; labelText: string} {
    const graphicIdentifier = this.setAndGetIdentifierOnGraphic(graphic);
    const labelConfiguration = this.createLabelForGeometry(graphic.geometry as TGeometry, graphicIdentifier);
    this.cleanup();
    this.layer.add(labelConfiguration.label);
    return labelConfiguration;
  }

  /**
   * Creates a label for a given geometry and returns the location and the symbolization as a TextSymbol. The labeltext ist container
   * within the symbolization.
   * @param geometry
   * @protected
   */
  protected abstract createLabelConfigurationForGeometry(geometry: TGeometry): LabelConfiguration;

  private createLabelForGeometry(geometry: TGeometry, belongsToGraphic: string): {label: Graphic; labelText: string} {
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
}
