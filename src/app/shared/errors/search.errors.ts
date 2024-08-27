import {RecoverableError} from './abstract.errors';

export class SearchResultsCouldNotBeLoaded extends RecoverableError {
  public override message = 'Die Resultate für die aktuelle Suche konnten nicht geladen werden.';
  public override name = 'SearchResultsCouldNotBeLoaded';
}

export class InvalidSearchParameters extends RecoverableError {
  public override message = 'Um über die URL zu suchen müssen die Parameter "searchTerm" und "searchIndex" definiert sein.';
  public override name = 'InvalidSearchParameters';
}

export class NoSearchResultsFoundForParameters extends RecoverableError {
  public override message = 'Für diesen Suchbegriff konnten im angegebenen Index keine Resultate gefunden werden.';
  public override name = 'NoSearchResultsFoundForParameters';
}
