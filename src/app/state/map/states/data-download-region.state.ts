import {CantonWithGeometry, Municipality, MunicipalityWithGeometry} from '../../../shared/interfaces/gb3-geoshop-product.interface';
import {LoadingState} from '../../../shared/types/loading-state.type';

export interface DataDownloadRegionState {
  canton: CantonWithGeometry | undefined;
  cantonLoadingState: LoadingState;
  municipalities: Municipality[];
  municipalitiesLoadingState: LoadingState;
  currentMunicipality: MunicipalityWithGeometry | undefined;
  currentMunicipalityLoadingState: LoadingState;
}
