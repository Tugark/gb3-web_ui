export interface DataCatalogueSearchResultDisplayItemField {
  title: string;
  content: string;
  /**
   * For long contents, setting this flag to true will add an ellipsis if the text is too long.
   */
  truncatable?: boolean;
}

export interface DataCatalogueSearchResultDisplayItem {
  title: string;
  uuid: string;
  relativeUrl: string;
  fields: DataCatalogueSearchResultDisplayItemField[];
}
