import {createActionGroup, emptyProps, props} from '@ngrx/store';
import {ExportFormat} from '../../../shared/types/export-format.type';
import {errorProps} from '../../../shared/utils/error-props.utils';

export const ExportActions = createActionGroup({
  source: 'Export',
  events: {
    'Request Drawings Export': props<{exportFormat: ExportFormat}>(),
    'Set Drawings Export Request Response': emptyProps(),
    'Set Drawings Export Request Error': errorProps(),
  },
});