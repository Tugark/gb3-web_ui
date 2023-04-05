import {Injectable} from '@angular/core';
import {BaseApiService} from '../abstract-api.service';
import {RootObject as KTZHNewsRootObject} from '../../../models/ktzh-news-generated.interfaces';
import {News} from '../../../interfaces/news.interface';
import {map} from 'rxjs/operators';
import {Observable} from 'rxjs';
import {environment} from '../../../../../environments/environment';
import {NewsService} from '../../../interfaces/news-service.interface';

@Injectable({
  providedIn: 'root'
})
export class KTZHNewsService extends BaseApiService implements NewsService {
  protected apiBaseUrl: string = `${environment.apiConfigs.ktzhWebsite.baseUrl}/de/news-uebersicht/_jcr_content.zhweb-news.zhweb-cache.json`;
  private topicsFilter: string[] = ['planen-bauen', 'geoinformation'];
  private organisationFilter: string[] = ['kanton-zuerich', 'baudirektion', 'amt-fuer-raumentwicklung'];

  public loadNews(): Observable<News[]> {
    return this.get<KTZHNewsRootObject>(this.getNewsUrl()).pipe(map((result) => this.transformNewsResult(result)));
  }

  protected transformNewsResult(result: KTZHNewsRootObject) {
    return result.news.map((newsItem) => {
      return {
        ...newsItem,
        link: `${environment.apiConfigs.ktzhWebsite.baseUrl}${newsItem.link}`
      };
    });
  }

  private getNewsUrl(): string {
    const url = new URL(this.apiBaseUrl);
    url.searchParams.set('topic', `themen:${this.topicsFilter.join('/')}`);
    url.searchParams.set('organisation', `organisationen:${this.organisationFilter.join('/')}`);
    url.searchParams.set('orderBy', 'new');
    return url.toString();
  }
}
