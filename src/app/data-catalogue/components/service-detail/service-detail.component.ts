import {Component, Inject} from '@angular/core';
import {ServiceMetadata} from '../../../shared/interfaces/gb3-metadata.interface';
import {ActivatedRoute} from '@angular/router';
import {Gb3MetadataService} from '../../../shared/services/apis/gb3/gb3-metadata.service';
import {ConfigService} from '../../../shared/services/config.service';
import {DataDisplayElement} from '../../types/data-display-element';
import {BaseMetadataInformation} from '../../interfaces/base-metadata-information.interface';
import {AbstractBaseDetailComponent} from '../abstract-base-detail/abstract-base-detail.component';
import {MetadataLink} from '../../interfaces/metadata-link.interface';
import {DataExtractionUtils} from '../../utils/data-extraction.utils';

@Component({
  selector: 'service-detail',
  templateUrl: './service-detail.component.html',
  styleUrls: ['./service-detail.component.scss'],
})
export class ServiceDetailComponent extends AbstractBaseDetailComponent<ServiceMetadata> {
  public baseMetadataInformation?: BaseMetadataInformation;
  public informationElements: DataDisplayElement[] = [];
  public metadataContactElements: DataDisplayElement[] = [];
  public serviceUrlForCopy?: string;
  public linkedDatasets: MetadataLink[] = [];

  constructor(
    @Inject(ActivatedRoute) route: ActivatedRoute,
    @Inject(Gb3MetadataService) gb3MetadataService: Gb3MetadataService,
    @Inject(ConfigService) configService: ConfigService,
  ) {
    super(route, gb3MetadataService, configService);
  }

  protected loadMetadata(id: string) {
    return this.gb3MetadataService.loadServiceDetail(id);
  }

  protected handleMetadata(serviceMetadata: ServiceMetadata) {
    this.baseMetadataInformation = this.extractBaseMetadataInformation(serviceMetadata);
    this.informationElements = this.extractInformationElements(serviceMetadata);
    this.metadataContactElements = DataExtractionUtils.extractContactElements(serviceMetadata.contact.metadata);
    this.linkedDatasets = serviceMetadata.datasets;
    this.serviceUrlForCopy = serviceMetadata.url;
  }

  private extractBaseMetadataInformation(serviceMetadata: ServiceMetadata): BaseMetadataInformation {
    return {
      itemTitle: serviceMetadata.name,
      keywords: ['Geodienst'], // todo: add OGD status once API delivers that
    };
  }

  private extractInformationElements(serviceMetadata: ServiceMetadata): DataDisplayElement[] {
    return [
      {title: 'GIS-ZH Nr.', value: serviceMetadata.guid.toString(), type: 'text'},
      {title: 'Geodienst', value: serviceMetadata.serviceType, type: 'text'},
      {title: 'Bezeichnung', value: serviceMetadata.name, type: 'text'},
      {title: 'Beschreibung', value: serviceMetadata.description, type: 'text'},
      {title: 'URL', value: serviceMetadata.url, type: 'url'},
      {title: 'GetCapabilities', value: this.createGetCapabilitiesLink(serviceMetadata.url, serviceMetadata.serviceType), type: 'url'},
      {title: 'Version', value: serviceMetadata.version, type: 'text'},
      {title: 'Zugang', value: serviceMetadata.access, type: 'text'},
    ];
  }

  private createGetCapabilitiesLink(baseUrl: string, serviceType: string): string {
    try {
      const url = new URL(baseUrl);
      url.searchParams.append('service', serviceType);
      url.searchParams.append('request', 'GetCapabilities');

      return url.toString();
    } catch (e) {
      return baseUrl;
    }
  }
}
