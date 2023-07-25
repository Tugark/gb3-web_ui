import {Injectable, OnDestroy, OnInit} from '@angular/core';
import {LoadingState} from '../../../shared/types/loading-state';
import {Observable, Subscription, switchMap, tap, throwError} from 'rxjs';
import {ActivatedRoute} from '@angular/router';
import {Gb3MetadataService} from '../../../shared/services/apis/gb3/gb3-metadata.service';
import {ConfigService} from '../../../shared/services/config.service';
import {DataDisplayElement} from '../../types/data-display-element';
import {MainPage} from '../../../shared/enums/main-page.enum';
import {DataCataloguePage} from '../../../shared/enums/data-catalogue-page.enum';
import {DatasetMetadata, MapMetadata, ProductMetadata, ServiceMetadata} from '../../../shared/interfaces/gb3-metadata.interface';
import {catchError} from 'rxjs/operators';
import {BaseMetadataInformation} from '../../interfaces/base-metadata-information.interface';
import {RouteParamConstants} from '../../../shared/constants/route-param.constants';

type DetailMetadata = ProductMetadata | MapMetadata | ServiceMetadata | DatasetMetadata;

@Injectable()
export abstract class AbstractBaseDetail<T extends DetailMetadata> implements OnInit, OnDestroy {
  public abstract baseMetadataInformation?: BaseMetadataInformation;
  public abstract informationElements: DataDisplayElement[];
  public loadingState: LoadingState = 'loading';
  public readonly apiBaseUrl: string;
  public readonly mainPageEnum = MainPage;
  public readonly dataCataloguePageEnum = DataCataloguePage;

  protected readonly subscriptions: Subscription = new Subscription();

  protected constructor(
    private readonly route: ActivatedRoute,
    protected readonly gb3MetadataService: Gb3MetadataService,
    private readonly configService: ConfigService,
  ) {
    this.apiBaseUrl = this.configService.apiConfig.gb2StaticFiles.baseUrl;
  }

  public ngOnInit(): void {
    this.initSubscriptions();
  }

  public ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  protected initSubscriptions() {
    this.subscriptions.add(
      this.route.paramMap
        .pipe(
          switchMap((params) => {
            const id = params.get(RouteParamConstants.RESOURCE_IDENTIFIER);
            if (!id) {
              // note: this can never happen since the :id always matches - but Angular does not know typed URL parameters.
              return throwError(() => new Error('No id specified'));
            }
            return this.loadMetadata(id).pipe(
              catchError((err: unknown) => {
                this.loadingState = 'error';
                return throwError(() => err); // todo: forward to 404 page
              }),
            );
          }),
          tap((metadata: T) => {
            this.handleMetadata(metadata);
            this.loadingState = 'loaded';
          }),
        )
        .subscribe(),
    );
  }

  /**
   * Loads the metadata from the API
   * @param id The ID of the desired metadata.
   */
  protected abstract loadMetadata(id: string): Observable<T>;

  /**
   * Handles the metadata object from the API and extracts all necessary information
   */
  protected abstract handleMetadata(result: T): void;
}
