import {Injectable} from '@angular/core';
import {Gb3ApiService} from './gb3-api.service';
import {TopicsFeatureInfoDetailData, TopicsLegendDetailData, TopicsListData} from '../../../models/gb3-api-generated.interfaces';
import {Geometry} from 'geojson';
import {LegendResponse} from '../../../interfaces/legend.interface';
import {
  FilterConfiguration,
  Map,
  TimeSliderLayerSource,
  TimeSliderParameterSource,
  TimeSliderSourceType,
  TopicsResponse,
} from '../../../interfaces/topic.interface';
import {FeatureInfoResponse} from '../../../interfaces/feature-info.interface';
import {forkJoin, Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {SupportedSrs} from '../../../types/supported-srs.type';
import {DataCataloguePage} from '../../../enums/data-catalogue-page.enum';
import {MainPage} from '../../../enums/main-page.enum';

import {InvalidTimeSliderConfiguration} from '../../../errors/map.errors';
import {QueryTopic} from '../../../interfaces/query-topic.interface';

const FEATURE_INFO_SRS: SupportedSrs = 2056;

@Injectable({
  providedIn: 'root',
})
export class Gb3TopicsService extends Gb3ApiService {
  protected readonly endpoint = 'topics';
  private readonly staticFilesUrl = this.configService.apiConfig.gb2StaticFiles.baseUrl;
  private readonly dataTabUrl = `/${MainPage.Data}/${DataCataloguePage.Datasets}`;
  private readonly MapTabUrl = `/${MainPage.Data}/${DataCataloguePage.Maps}`;

  public loadTopics(): Observable<TopicsResponse> {
    const requestUrl = this.createTopicsUrl();
    const topicsListData = this.get<TopicsListData>(requestUrl);
    return topicsListData.pipe(map((data) => this.transformTopicsListDataToTopicsResponse(data)));
  }

  public loadLegends(queryTopics: QueryTopic[]): Observable<LegendResponse[]> {
    const requestUrls = queryTopics.map((queryLegend) => this.createLegendUrl(queryLegend));
    return forkJoin(requestUrls.map((requestUrl) => this.get<TopicsLegendDetailData>(requestUrl))).pipe(
      map((data) => this.mapTopicsLegendDetailDataToLegendResponse(data)),
    );
  }

  public loadFeatureInfos(x: number, y: number, queryTopics: QueryTopic[]): Observable<FeatureInfoResponse[]> {
    const requestUrls = queryTopics.map(({topic, layersToQuery}) => this.createFeatureInfoUrl(topic, x, y, layersToQuery));
    return forkJoin(requestUrls.map((requestUrl) => this.get<TopicsFeatureInfoDetailData>(requestUrl))).pipe(
      map((data) => this.mapTopicsFeatureInfoDetailDataToFeatureInfoResponse(data)),
    );
  }

  private createLegendUrl(queryTopic: QueryTopic): string {
    const url = new URL(`${this.getFullEndpointUrl()}/${queryTopic.topic}/legend`);
    url.searchParams.set('layer', queryTopic.layersToQuery);

    return url.toString();
  }

  /**
   * Transforms the given filter configurations to URL parameters (name, value)
   */
  public transformFilterConfigurationToParameters(filterConfigurations: FilterConfiguration[]): {name: string; value: string}[] {
    const attributeFilterParameters: {name: string; value: string}[] = [];
    filterConfigurations.forEach((filterConfiguration) => {
      const parameterValue = filterConfiguration.filterValues
        .map((filterValue) => {
          // all filter values must be sent in the correct order; the active filtered ones as an empty string
          const values: string[] = filterValue.isActive ? filterValue.values.map(() => '') : filterValue.values;
          // all filter values (empty or not) must be enclosed by single quotation marks and separated by commas
          return values.map((v) => `'${v}'`).join(',');
        })
        .join(',');
      attributeFilterParameters.push({name: filterConfiguration.parameter, value: parameterValue});
    });
    return attributeFilterParameters;
  }

  /**
   * Maps the generic TopicsLegendDetailData type from the API endpoint to the internal interface LegendResponse
   */
  private mapTopicsLegendDetailDataToLegendResponse(topicsLegendDetailData: TopicsLegendDetailData[]): LegendResponse[] {
    return topicsLegendDetailData.map((data) => {
      const {legend} = data;
      return {
        legend: {
          ...legend,
          metaDataLink: this.createMapTabLink(legend.geolion_karten_uuid),
          layers: legend.layers.map((layer) => {
            return {
              ...layer,
              metaDataLink: layer.geolion_gds ? this.createDataTabLink(layer.geolion_geodatensatz_uuid) : undefined, // Currently, the API returns null for the uuid.
              layerClasses: layer.layer_classes?.map((layerClass) => {
                return {
                  ...layerClass,
                };
              }),
            };
          }),
        },
      };
    });
  }

  private createMapTabLink(uuid: string | null): string {
    return `${this.MapTabUrl}/${uuid}`;
  }

  private createDataTabLink(uuid: string | null): string {
    return `${this.dataTabUrl}/${uuid}`;
  }

  private createTopicsUrl(): string {
    return `${this.getFullEndpointUrl()}`;
  }

  /**
   * Transforms the generic TopicsListData type from the API endpoint to the internal interface TopicsResponse
   */
  private transformTopicsListDataToTopicsResponse(topicsListData: TopicsListData): TopicsResponse {
    const topicsResponse: TopicsResponse = {
      topics: topicsListData.categories.map((category) => {
        return {
          ...category,
          maps: category.topics.map((topic) => {
            return {
              ...topic,
              id: topic.topic,
              uuid: topic.geolion_karten_uuid,
              printTitle: topic.print_title,
              gb2Url: topic.gb2_url,
              icon: this.createAbsoluteIconUrl(topic.icon),
              wmsUrl: topic.wms_url,
              minScale: topic.min_scale,
              permissionMissing: topic.permission_missing,
              layers: topic.layers
                .map((layer) => {
                  return {
                    ...layer,
                    uuid: layer.geolion_geodatensatz_uuid,
                    groupTitle: layer.group_title,
                    minScale: layer.min_scale,
                    maxScale: layer.max_scale,
                    wmsSort: layer.wms_sort,
                    tocSort: layer.toc_sort,
                    initiallyVisible: layer.initially_visible,
                    permissionMissing: layer.permission_missing,
                    visible: layer.initially_visible,
                    isHidden: false,
                  };
                })
                .reverse(), // reverse the order of the layers because the order in the GB3 interfaces (Topic, ActiveMapItem) is inverted to the order of the WMS specifications
              timeSliderConfiguration: topic.timesliderConfiguration
                ? {
                    ...topic.timesliderConfiguration,
                    sourceType: topic.timesliderConfiguration.sourceType as TimeSliderSourceType,
                    source: this.transformTimeSliderConfigurationSource(
                      topic.timesliderConfiguration.source,
                      topic.timesliderConfiguration.sourceType,
                    ),
                  }
                : undefined,
              filterConfigurations: topic.filterConfigurations?.map((filterConfiguration) => {
                return {
                  ...filterConfiguration,
                  filterValues: filterConfiguration.filterValues.map((filterValue) => {
                    return {
                      ...filterValue,
                      isActive: false,
                    };
                  }),
                };
              }),
              searchConfigurations: topic.searchConfigurations ?? undefined,
            };
          }),
        };
      }),
    };
    topicsResponse.topics.forEach((topic) => {
      topic.maps.forEach((topicMap) => {
        topicMap.layers.forEach((layer) => {
          layer.isHidden = this.isHiddenLayer(layer.layer, topicMap);
        });
      });
    });
    return topicsResponse;
  }

  private transformTimeSliderConfigurationSource(
    // the following typing for `source` is used to extract a subtype of the generated interface `TopicsListData`
    source: TopicsListData['categories'][0]['topics'][0]['timesliderConfiguration']['source'],
    sourceType: string,
  ): TimeSliderParameterSource | TimeSliderLayerSource {
    const timeSliderSourceType: TimeSliderSourceType = sourceType as TimeSliderSourceType;
    switch (timeSliderSourceType) {
      case 'parameter':
        if (!source.startRangeParameter || !source.endRangeParameter || !source.layerIdentifiers) {
          throw new InvalidTimeSliderConfiguration('Missing attributes inside the parameter configuration.');
          // handling
        }
        return {
          startRangeParameter: source.startRangeParameter,
          endRangeParameter: source.endRangeParameter,
          layerIdentifiers: source.layerIdentifiers,
        } as TimeSliderParameterSource;
      case 'layer':
        if (!source.layers) {
          throw new InvalidTimeSliderConfiguration('Missing attributes inside the layer configuration.');
        }
        return {
          layers: source.layers.map((layer) => {
            return {
              layerName: layer.layerName,
              date: layer.date,
            };
          }),
        } as TimeSliderLayerSource;
    }
  }

  /**
   * Returns whether the given layer should be hidden from all visible layer lists.
   * For example if the layer is part of a time slider it should not be visible in any kind of layer list except the internal time slider
   * control.
   */
  private isHiddenLayer(layer: string, topicMap: Map): boolean {
    let isHidden = false;
    if (topicMap.timeSliderConfiguration && topicMap.timeSliderConfiguration.sourceType === 'layer') {
      const timeSliderLayerSource = topicMap.timeSliderConfiguration.source as TimeSliderLayerSource;
      isHidden = timeSliderLayerSource.layers.some((l) => l.layerName === layer);
    }
    return isHidden;
  }

  private createAbsoluteIconUrl(relativeIconUrl: string): string {
    const url = new URL(`${this.staticFilesUrl}${relativeIconUrl}`);
    return url.toString();
  }

  private createFeatureInfoUrl(topicName: string, x: number, y: number, queryLayers: string): string {
    const url = new URL(`${this.getFullEndpointUrl()}/${topicName}/feature_info`);
    url.searchParams.append('bbox', `${x},${y},${x},${y}`);
    url.searchParams.append('queryLayers', queryLayers);
    return url.toString();
  }

  /**
   * Maps the generic TopicsFeatureInfoDetailData type from the API endpoint to the internal interface FeatureInfoResponse
   */
  private mapTopicsFeatureInfoDetailDataToFeatureInfoResponse(
    topicsFeatureInfoDetailData: TopicsFeatureInfoDetailData[],
  ): FeatureInfoResponse[] {
    return topicsFeatureInfoDetailData.map((data) => {
      const {feature_info: featureInfo} = data;

      return {
        featureInfo: {
          ...featureInfo,
          results: {
            topic: featureInfo.results.topic,
            metaDataLink: this.createMapTabLink(featureInfo.results.geolion_karten_uuid),
            layers: featureInfo.results.layers.map((layer) => {
              return {
                ...layer,
                metaDataLink: this.createMapTabLink(layer.geolion_geodatensatz_uuid),
                features: layer.features.map((feature) => {
                  return {
                    ...feature,
                    fields: feature.fields.map((field) => {
                      return {
                        ...field,
                      };
                    }),
                    // The cast is required because the API typing delivers "type: string" which is not narrow enough
                    geometry: {...(feature.geometry as Geometry), srs: FEATURE_INFO_SRS},
                  };
                }),
              };
            }),
          },
        },
      };
    });
  }
}
