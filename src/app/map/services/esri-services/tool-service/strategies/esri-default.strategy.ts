import {EsriToolStrategy} from '../interfaces/strategy.interface';
import {UserDrawingLayer} from '../../../../../shared/enums/drawing-layer.enum';

/**
 * This is the default strategy which is assigned to the ToolService by default. It does not have any functionality and
 * does nothing when the methods are called.
 */
export class EsriDefaultStrategy implements EsriToolStrategy {
  public internalLayerType: UserDrawingLayer = UserDrawingLayer.Drawings;

  public start(): void {}

  public cancel() {}
}
