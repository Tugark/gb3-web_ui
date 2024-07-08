import {SupportedEsriTool} from '../services/esri-services/tool-service/strategies/abstract-esri-drawable-tool.strategy';

export type PolygonType = Extract<SupportedEsriTool, 'circle' | 'polygon' | 'rectangle'>;
