import {Observable} from 'rxjs';
import {TimeExtent} from './time-extent.interface';
import {TimeSliderConfiguration} from '../../shared/interfaces/topic.interface';
import {Gb2WmsActiveMapItem} from '../models/implementations/gb2-wms.model';

export interface TimeSliderService {
  /** Assigns a time slider widget to the given container based on the active map item */
  assignTimeSliderWidget(activeMapItem: Gb2WmsActiveMapItem, container: HTMLDivElement): void;

  /** Returns an observable which fires an event in case the time extent changes for the active map item with the given ID */
  watchTimeExtent(activeMapItemId: string): Observable<TimeExtent>;

  /** Creates a new time extent from the given new time extent. The created time extent will be fully validated against
   * the limitations and rules of the time slider configuration. */
  createValidTimeExtent(timeSliderConfig: TimeSliderConfiguration, newValue: TimeExtent, oldValue?: TimeExtent): TimeExtent;
}
