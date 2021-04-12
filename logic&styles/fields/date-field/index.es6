import BaseField from '../base-field';
import { formatToDate } from '~/helpers';
import './date-field.sass';

export default class DateField extends BaseField {
  constructor(elem, options) {
    const baseOptions = {
      ...options,
      readonly: options.readonly || true,
      onFocusCallback: options.onFocusCallback,
      disableSelect: true,
    };

    super(elem, baseOptions);

    this.localDate = options.localDate || null;
    this.dateFormat = options.dateFormat || 'd MMM';

    // Init
    this.init();
  }

  init = () => {
    this.setupInputFromLocalStorage(this.localDate, this.dateFormat);
  };

  // Setup from local storage
  setupInputFromLocalStorage = (date, pattern) => {
    if (this.localDate) this.setValue(formatToDate(date, pattern));
  };
}
