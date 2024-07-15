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

export type LabelConfiguration = {location: Point; symbolization: TextSymbol};

export abstract class AbstractEsriMeasurementStrategy<
  TGeometry extends Polygon | Polyline | Point,
  TDrawingCallbackHandler extends DrawingCallbackHandler['completeMeasurement'],
> extends AbstractEsriDrawableToolStrategy<TDrawingCallbackHandler> {
  public readonly internalLayerType: UserDrawingLayer = UserDrawingLayer.Measurements;
  protected labelPosition: Point | undefined;
  protected currentLabel: Graphic | undefined;
  protected labelDisplacementY: number = 0;
  protected labelDisplacementX: number = 0;
  protected isDrawingFinished = false;

  protected constructor(layer: GraphicsLayer, mapView: MapView, completeDrawingCallbackHandler: TDrawingCallbackHandler) {
    super(layer, mapView, completeDrawingCallbackHandler);
  }

  public start() {
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
      ({state, graphic}: {state: __esri.SketchViewModelCreateEvent['state']; graphic: Graphic}) => {
        switch (state) {
          case 'start':
            break; // currently, this event does not trigger any action
          case 'cancel':
            this.removeCurrentLabel();
            this.sketchViewModel.view.removeHandles(HANDLE_GROUP_KEY);
            break;
          case 'active':
            this.currentLabel = this.addLabelToLayer(graphic).label;
            break;
          case 'complete':
            this.handleCompleteSketchViewModel(graphic);
            break;
        }
      },
    );
  }

  protected handlePointerMove(event: __esri.ViewPointerMoveEvent) {
    this.labelPosition = this.sketchViewModel.view.toMap({x: event.x + this.labelDisplacementX, y: event.y - this.labelDisplacementY});
  }

  protected removeCurrentLabel() {
    if (this.currentLabel) {
      this.layer.remove(this.currentLabel);
    }
  }

  protected addLabelToLayer(graphic: Graphic): {label: Graphic; labelText: string} {
    const graphicIdentifier = this.setAndGetIdentifierOnGraphic(graphic);
    const labelConfiguration = this.createLabelForGeometry(graphic.geometry as TGeometry, graphicIdentifier);
    this.removeCurrentLabel();
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

  private handleCompleteSketchViewModel(graphic: Graphic): void {
    this.isDrawingFinished = true;
    const labelConfiguration = this.addLabelToLayer(graphic);
    this.completeDrawingCallbackHandler(graphic, labelConfiguration.label, labelConfiguration.labelText);
  }

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
