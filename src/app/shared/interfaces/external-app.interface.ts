import {AccessMode} from '../types/access-mode.type';

type ExternalAppTopic =
  | 'Bauten'
  | 'Boden'
  | 'Flora und Fauna'
  | 'Freizeit'
  | 'Geologie'
  | 'Geschichte und Kultur'
  | 'Luft und Klima'
  | 'Lärm'
  | 'Luft- und Satellitenbilder'
  | 'Raumplanung'
  | 'Topographie'
  | 'Umwelt'
  | 'Ver- und Entsorgung'
  | 'Verkehr'
  | 'Wasser';

type ExternalAppCategory =
  | 'Fachapplikationen'
  | 'WebMap'
  | 'Datenanalyse'
  | 'Visualisierung'
  | '3D'
  | 'Notebook'
  | 'Mobile GIS'
  | 'Dashboard'
  | 'Erfassungstool';

export interface ExternalApp {
  visibility: AccessMode | 'both';
  title: string;
  description: string;
  email: string;
  keywords: string[];
  topic: ExternalAppTopic;
  categories: ExternalAppCategory[];
  appUrl: string;
  image: {
    url: string;
    altText: string;
  };
  department: string;
}
