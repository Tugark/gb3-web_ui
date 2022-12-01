import {Injectable} from '@angular/core';
import {Gb3ApiService} from './gb3-api.service';
import {TopicsLegendDetailData, TopicsListData} from '../../../models/gb3-api-generated.interfaces';
import {LegendResponse, TopicsResponse} from '../../../models/gb3-api.interfaces';

@Injectable({
  providedIn: 'root'
})
export class Gb3TopicsService extends Gb3ApiService {
  private readonly endpoint = 'v3/topics';

  public async loadTopics(): Promise<TopicsResponse> {
    const requestUrl = this.createTopicsUrl();
    const topics = await this.get<TopicsListData>(requestUrl);
    return {layerCatalogItems: topics.categories};
  }

  public async loadLegend(topicName: string): Promise<LegendResponse> {
    const requestUrl = this.createLegendUrl(topicName);
    return await this.get<TopicsLegendDetailData>(requestUrl);
  }

  private createLegendUrl(topicName: string): string {
    return `${this.apiBaseUrl}/${this.endpoint}/${topicName}/legend`;
  }

  private createTopicsUrl(): string {
    return `${this.apiBaseUrl}/${this.endpoint}`;
  }
}
