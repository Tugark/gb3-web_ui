import {Inject, Injectable} from '@angular/core';
import {defaultBasemap, defaultBasemaps} from '../configs/base-map.config';
import {defaultMapConfig} from '../configs/map.config';
import {MapConstants} from '../constants/map.constants';
import {DOCUMENT} from '@angular/common';
import {defaultRuntimeConfig} from '../configs/runtime.config';
import {ApiConfig, AuthSettings, OverrideSettings, RuntimeConfig} from '../interfaces/runtime-config.interface';
import {Gb2Constants} from '../constants/gb2.constants';
import {layerSymbolizations} from '../configs/symbolization.config';

import {HostNameResolutionMismatch} from '../errors/app.errors';
import {EmbeddedMapConstants} from '../constants/embedded-map.constants';
import {dataCatalogueFilterConfig} from '../configs/filter.config';
import {DataCatalogueFilterConfiguration} from '../interfaces/data-catalogue-filter.interface';
import {SearchIndex} from './apis/search/interfaces/search-index.interface';
import {searchIndexConfig, SearchIndexType} from '../configs/search-index.config';
import {SearchConfig} from '../interfaces/search-config.interface';
import {searchConfig} from '../configs/search.config';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  public readonly basemapConfig = {
    availableBasemaps: defaultBasemaps,
    defaultBasemap: defaultBasemap,
  };
  public readonly layerSymbolizations = layerSymbolizations;
  public readonly gb2Config = {
    wmsFormatMimeType: Gb2Constants.WMS_IMAGE_FORMAT_MIME_TYPE,
  };
  public readonly mapConfig = {
    internalLayerPrefix: MapConstants.INTERNAL_LAYER_PREFIX,
    locateMeZoom: MapConstants.LOCATE_ME_ZOOM,
    defaultMapConfig: defaultMapConfig,
    mapScaleConfig: {
      maxScale: MapConstants.MAXIMUM_MAP_SCALE,
      minScale: MapConstants.MINIMUM_MAP_SCALE,
    },
  };
  public readonly apiConfig: ApiConfig;
  public readonly overridesConfig: OverrideSettings;
  public readonly authConfig: AuthSettings;
  public readonly embeddedMapConfig = {
    title: EmbeddedMapConstants.DEFAULT_TITLE,
    width: EmbeddedMapConstants.DEFAULT_WIDTH,
    height: EmbeddedMapConstants.DEFAULT_HEIGHT,
    borderSize: EmbeddedMapConstants.DEFAULT_BORDER_SIZE,
  };

  public get filterConfig(): {dataCatalogue: DataCatalogueFilterConfiguration[]} {
    return {
      dataCatalogue: dataCatalogueFilterConfig,
    };
  }
  public get searchConfig(): SearchConfig {
    return searchConfig;
  }
  public get searchIndexConfig(): SearchIndex[] {
    return searchIndexConfig;
  }

  constructor(@Inject(DOCUMENT) private readonly document: Document) {
    const runtimeConfig = this.findRuntimeConfig();
    if (!runtimeConfig) {
      throw new HostNameResolutionMismatch(); // note: this will actually prevent the app from loading in general
    }

    this.apiConfig = runtimeConfig.apiBasePaths;
    this.overridesConfig = runtimeConfig.overrides;
    this.authConfig = runtimeConfig.authSettings;
  }

  /**
   * Filters the search indexes from the config using the given search index types.
   * @param searchIndexTypes Only search indexes with this type will be returned
   */
  public filterSearchIndexes(searchIndexTypes: SearchIndexType[]): SearchIndex[] {
    return this.searchIndexConfig.filter((searchIndex) => searchIndexTypes.includes(searchIndex.indexType));
  }

  /**
   * Extracts the hostname from Document.location, also removing any port mappings.
   *
   * Then, tries to find a matching runtime configuration or returns undefined.
   * @private
   */
  private findRuntimeConfig(): RuntimeConfig | undefined {
    const hostName = this.document.location.host.split(':')[0];
    return defaultRuntimeConfig.find((config) => config.hostMatch === hostName);
  }
}
