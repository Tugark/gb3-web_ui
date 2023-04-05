import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {Store} from '@ngrx/store';
import {TimeExtent} from '../../interfaces/time-extent.interface';
import {TimeSliderConfiguration} from '../../../shared/interfaces/topic.interface';
import * as dayjs from 'dayjs';
import {ManipulateType} from 'dayjs';
import {TimeSliderService} from '../../services/time-slider.service';
import {TimeExtentUtil} from '../../../shared/utils/time-extent.util';
import * as duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

@Component({
  selector: 'time-slider',
  templateUrl: './time-slider.component.html',
  styleUrls: ['./time-slider.component.scss']
})
export class TimeSliderComponent implements OnInit {
  @Output() public timeExtentChanged = new EventEmitter<TimeExtent>();

  @Input() public initialTimeExtent!: TimeExtent;
  @Input() public timeSliderConfiguration!: TimeSliderConfiguration;

  public effectiveFormattedMinimumValue: string = '';
  public effectiveFormattedMaximumValue: string = '';

  public numberOfAvailableDates: number = 0;
  public firstSliderPosition: number = 0;
  // the second slider position is `undefined` in case that there is a fixed range
  public secondSliderPosition?: number;
  public formattedTimeExtent: string = '';

  private availableDates!: Date[];
  private timeExtent!: TimeExtent;
  // the time slider shows a simple current value (e.g. `2001` instead of `2001-2002`) if it has a range of exactly one of a single time unit (year, month, ...)
  private hasSimpleCurrentValue: boolean = false;

  constructor(private readonly store: Store, private readonly timeSliderService: TimeSliderService) {}

  public ngOnInit() {
    this.availableDates = this.timeSliderService.createStops(this.timeSliderConfiguration);
    this.numberOfAvailableDates = this.availableDates.length;
    this.timeExtent = {start: this.initialTimeExtent.start, end: this.initialTimeExtent.end};
    this.firstSliderPosition = this.findPositionOfDate(this.timeExtent.start) ?? 0;
    this.secondSliderPosition = this.timeSliderConfiguration.range ? undefined : this.findPositionOfDate(this.timeExtent.end);
    this.effectiveFormattedMinimumValue = this.convertDateToString(this.availableDates[0]);
    this.effectiveFormattedMaximumValue = this.convertDateToString(this.availableDates[this.numberOfAvailableDates - 1]);
    this.hasSimpleCurrentValue = this.isRangeExactlyOneOfSingleTimeUnit(this.timeSliderConfiguration.range);
    this.formattedTimeExtent = this.convertTimeExtentToString(this.timeExtent);
  }

  public refreshCurrentValue() {
    const currentTimeExtent: TimeExtent = {
      start: this.availableDates[this.firstSliderPosition],
      end: this.secondSliderPosition ? this.availableDates[this.secondSliderPosition] : this.availableDates[this.firstSliderPosition]
    };
    this.formattedTimeExtent = this.convertTimeExtentToString(currentTimeExtent);
  }

  /**
   * Sets a new validated time extent using the current slider position(s).
   * @param hasStartDateChanged A value indicating whether the start date has changed; otherwise the end date has changed.
   */
  public setValidTimeExtent(hasStartDateChanged: boolean) {
    // create a new time extent based on the current slider position(s)
    const newTimeExtent: TimeExtent = {
      start: this.availableDates[this.firstSliderPosition],
      end: this.secondSliderPosition ? this.availableDates[this.secondSliderPosition] : this.availableDates[this.firstSliderPosition]
    };
    // calculate a valid time extent based on the new one
    // it can differ to the given time extent due to active limitations such as a minimal range between start and end time
    const newValidatedTimeExtent = this.timeSliderService.createValidTimeExtent(
      this.timeSliderConfiguration,
      newTimeExtent,
      hasStartDateChanged
    );

    // correct the thumb that was modified with the calculated time extent if necessary (e.g. enforcing a minimal range)
    const hasStartTimeBeenCorrected = Math.abs(dayjs(newValidatedTimeExtent.start).diff(newTimeExtent.start)) > 0;
    if (hasStartDateChanged && hasStartTimeBeenCorrected) {
      this.firstSliderPosition = this.findPositionOfDate(newValidatedTimeExtent.start) ?? 0;
    }
    const hasEndTimeBeenCorrected = Math.abs(dayjs(newValidatedTimeExtent.end).diff(newTimeExtent.end)) > 0;
    if (!hasStartDateChanged && !this.timeSliderConfiguration.range && hasEndTimeBeenCorrected) {
      this.secondSliderPosition = this.findPositionOfDate(newValidatedTimeExtent.end) ?? 0;
    }

    // overwrite the current time extent and trigger the corresponding event if the new validated time extent is different from the previous one
    if (
      Math.abs(dayjs(this.timeExtent.start).diff(newValidatedTimeExtent.start)) > 0 ||
      Math.abs(dayjs(this.timeExtent.end).diff(newValidatedTimeExtent.end)) > 0
    ) {
      this.timeExtent = newValidatedTimeExtent;
      this.timeExtentChanged.next(this.timeExtent);
    }

    // set the current time extent even if there is no difference; it's still possible that a value was automatically corrected
    this.formattedTimeExtent = this.convertTimeExtentToString(this.timeExtent);
  }


  /**
   * Returns `true` if the given range is defined and is exactly one of a single time unit (year, month, ...).
   * If the optional parameter `allowedTimeUnits` is given then only the units in there are allowed; all other return `false` as well.
   * @param range The range (in ISO-8601 time span format) to be evaluated
   * @param allowedTimeUnits Optional array of time units that are allowed for the single time unit.
   *
   * @example
   * `P1Y1M` is a duration of one year AND one month which is more than one time unit; therefore is the result `false`
   * `P2Y` is a duration of two years which is more than one of a single time unit; therefore is the result `false`
   * `P1D` is a duration of one day which is exactly one of a single time unit; therefore the result is `true`
   */
  private isRangeExactlyOneOfSingleTimeUnit(range: string | null, allowedTimeUnits?: ManipulateType[]): boolean {
    if (range) {
      const rangeDuration = dayjs.duration(range);
      const unit = TimeExtentUtil.extractUnitFromDuration(rangeDuration);
      if (unit) {
        const isAllowedUnit = !allowedTimeUnits || allowedTimeUnits.includes(unit);
        const isOneTimeUnit = TimeExtentUtil.getDurationAsNumber(rangeDuration, unit) === 1;
        return isAllowedUnit && isOneTimeUnit;
      }
    }
    return false;
  }

  private findPositionOfDate(date: Date): number | undefined {
    const index = this.availableDates.findIndex((availableDate) => Math.abs(dayjs(availableDate).diff(date)) === 0);
    return index === -1 ? undefined : index;
  }

  private convertDateToString(value: Date): string {
    return dayjs(value, this.timeSliderConfiguration.dateFormat).format(this.timeSliderConfiguration.dateFormat);
  }

  private convertTimeExtentToString(timeExtent: TimeExtent): string {
    return this.hasSimpleCurrentValue
      ? this.convertDateToString(timeExtent.start)
      : `${this.convertDateToString(timeExtent.start)} - ${this.convertDateToString(timeExtent.end)}`;
  }
}
