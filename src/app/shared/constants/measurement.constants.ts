import {SupportedEsriTool} from '../../map/services/esri-services/tool-service/strategies/supported-esri-tool.type';

type labelDisplacement = {
  [key in SupportedEsriTool]: {
    /** the displacement in pixels in x direction */
    x: number;
    /** the displacement in pixels in y direction */
    y: number;
  };
};

export class MeasurementConstants {
  /** The displacement distance in pixels for measurement labels */
  public static readonly LABEL_DISPLACEMENT: labelDisplacement = {
    circle: {
      x: 50,
      y: 25,
    },
    polygon: {
      x: 50,
      y: 25,
    },
    rectangle: {
      x: 50,
      y: 25,
    },
    point: {
      x: 0,
      y: 15,
    },
    polyline: {
      x: 0,
      y: 15,
    },
  };
}
