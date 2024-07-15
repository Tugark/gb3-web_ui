import {SupportedEsriTool} from './supported-esri-tool.type';

export type SupportedEsriPolygonTool = Extract<SupportedEsriTool, 'circle' | 'polygon' | 'rectangle'>;
