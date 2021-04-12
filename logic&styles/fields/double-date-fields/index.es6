import throttle from 'lodash-es/throttle';
import DateField from '../date-field';
import { formatToDate } from '~/helpers';

const DATEPICKER_TEXT_TO = 'Выберите дату отправления';
const DATEPICKER_TEXT_FROM = 'Выберите дату возвращения';
const BACKEND_FORMAT = 'yyyy-MM-dd';
const USER_FORMAT = 'EEEEEE, d.MM';

export default class DoubleDateFields {
  constructor(elem, options) {
    this.$form = elem;

    this.optionsFrom = options.fieldFrom || {};
    this.optionsTo = options.fieldTo || {};
    this.onPick = options.onPick || null;
    this.onFocus = options.onFocus || null;
    this.onBlur = options.onBlur || null;
    [this.localDateFrom, this.localDateTo] = options.localSelectedDates;

    this.mode = options.mode || 'single';
    this.formatTemplate = options.formatTemplate || 'd-m-Y';

    // Variables
    this.isFirstInit = true;
    this.isOpen = false;

    // initial dates array
    this.dates = {
      inputDates: [],
      searchDates: [],
    };

    this.MAX_MIDTH = 1024;
    this.windowWidth = window.innerWidth;

    // Calendar instance
    this.datepicker = null;
    this.dateFromInstance = null;
    this.dateToInstance = null;

    // HTML elements
    this.$htmlAndBody = document.querySelectorAll(`html, body, .wrapper`);

    // HTML fields elements
    this.$dateFrom = this.$form.querySelector('.js-date-from');
    this.$dateFromLabel = this.$dateFrom.querySelector('.js-label');
    this.$dateTo = this.$form.querySelector('.js-date-to');
    this.$dateToLabel = this.$dateTo.querySelector('.js-label');
    this.$dateFromInput = this.$dateFrom.querySelector('.js-input');
    this.$dateToInput = this.$dateTo.querySelector('.js-input');

    // HTML modal elements
    this.$pickerModal = this.$form.querySelector('.js-datepicker');
    this.$pickerModalTitle = this.$pickerModal.querySelector('.js-head-title');
    this.$pickerModalDateBackBtn = this.$pickerModal.querySelector('.js-datemodal-btn');
    this.$pickerWrap = this.$pickerModal.querySelector('.js-calendar');
    this.$closeBtn = this.$pickerModal.querySelector('.js-modal-close');

    // Class variables
    this.openModalClass = 'js-modal-open';
    this.dateBackBtnDisabledClass = 'js-disabled';
    this.doubleDateClass = 'js-date-double';
    this.focusedClass = 'focused';
    this.visibleClass = 'visible';
    this.limitedClass = 'comm-limited';
    this.dateFromClass = 'js-date-from';
    this.dateToClass = 'js-date-to';
    this.incorrectClass = 'incorrect';
    this.datePickerClass = 'js-datepicker';
    this.yellowClass = 'new-search-forms__field--yellow';

    // Init
    this.init();
  }

  init = () => {
    this.blurField();
    this.initDateFields();
    this.clickOutsideHandler();
    this.handleOpenModal();
    this.handleResizeWindow();
  };

  initDateFields = () => {
    if (this.$dateFrom) {
      this.dateFromInstance = new DateField(this.optionsFrom.elem, {
        ...this.optionsFrom.options,
        localDate: this.localDateFrom,
        dateFormat: USER_FORMAT,
        onFocusCallback: () => {
          this.onChangeField(this.$dateFrom);
          this.openModal();
          this.$dateTo.classList.remove(this.focusedClass);
        },
      });
    }

    if (this.$dateTo) {
      this.dateToInstance = new DateField(this.optionsTo.elem, {
        ...this.optionsTo.options,
        localDate: this.localDateTo,
        dateFormat: USER_FORMAT,
        onFocusCallback: () => {
          this.onChangeField(this.$dateTo);
          this.openModal();
          this.$dateFrom.classList.remove(this.focusedClass);
        },
      });
    }
  };

  // Init calendar
  initCalendar = options => {
    if (this.$pickerWrap) {
      import(/* webpackChunkName: "calendar" */ '../calendar').then(({ default: Calendar }) => {
        this.datepicker = new Calendar(this.$pickerWrap, {
          ...options,
          localDates: [this.localDateFrom, this.localDateTo],
          mode: this.mode,
          formatTemplate: this.formatTemplate,
          onChange: dates => {
            this.checkBackBtn();
            this.disableFieldError();
            this.handleWriteDate(dates);
            this.onChangeField(this.$dateFrom, dates);
          },
        });

        if (this.localDateFrom) {
          this.enableBackBtnFromLocalStorage();

          if (this.localDateFrom && this.localDateTo) {
            this.handleWriteDate([this.localDateFrom, this.localDateTo], true);
          } else if (this.localDateFrom) {
            this.handleWriteDate([this.localDateFrom], true);
          }
        }
      });
    }
  };

  // Resize events
  handleResizeWindow = () => {
    window.addEventListener(
      'resize',
      throttle(() => {
        const windowWidth = window.innerWidth;

        if (windowWidth <= this.MAX_MIDTH) {
          this.windowWidth = windowWidth;
          this.clickOutsideHandler();
          this.handleOpenModal();
        }
      }, 200).bind(this),
    );
  };

  // Open modal
  openModal = () => {
    if (this.isFirstInit) {
      this.initCalendar();
      this.isFirstInit = false;
    } else if (this.dates.searchDates[0]) {
      this.datepicker.getCalendarInstance.setDate(this.dates.searchDates);
      this.datepicker.getCalendarInstance.jumpToDate(this.dates.searchDates[0]);
    }

    if (!this.$pickerModal.classList.contains(this.openModalClass)) {
      this.$pickerModal.classList.add(this.openModalClass);
    }

    if (window.innerWidth <= this.MAX_MIDTH) this.initMobileCalendar();
  };

  // Handlers
  handleOpenModal = () => {
    [this.$dateFrom, this.$dateTo].forEach(field => {
      field.addEventListener('click', () => {
        this.openModal();
        this.onChangeField(field);
        this.isOpen = true;
      });
    });
  };

  handleCloseModal = () => {
    this.$pickerModal.classList.remove(this.openModalClass);
    this.$htmlAndBody.forEach($elem => $elem.classList.remove(this.limitedClass));
    this.$dateFrom.classList.remove(this.focusedClass);
    this.$dateTo.classList.remove(this.focusedClass);
    this.isOpen = false;
  };

  clickOutsideHandler = () => {
    this.clickOutside(this.datePickerClass, this.doubleDateClass);
  };

  handleWriteDate = (date, isLocalDate = false) => {
    this.dates.inputDates = [];
    this.dates.searchDates = [];

    const [dateFrom, dateTo] = date;

    if (dateFrom) {
      this.dates.inputDates.push(formatToDate(dateFrom, USER_FORMAT));
      this.dates.searchDates.push(formatToDate(dateFrom, BACKEND_FORMAT));
      if (this.$dateFrom.classList.contains(this.yellowClass)) this.$dateFromLabel.classList.add(this.visibleClass);
    }

    if (dateTo) {
      this.dates.inputDates.push(formatToDate(dateTo, USER_FORMAT));
      this.dates.searchDates.push(formatToDate(dateTo, BACKEND_FORMAT));
      if (this.$dateTo.classList.contains(this.yellowClass)) this.$dateToLabel.classList.add(this.visibleClass);
    }

    if (!isLocalDate && date.length > 1) {
      this.handleCloseModal();
    }

    this.onPick(this.dates);
  };

  onChangeField = ($el, data = []) => {
    let defaultText = DATEPICKER_TEXT_TO;

    if ($el.classList.contains(this.dateFromClass)) {
      if (!this.$dateFromInput.value) {
        this.$pickerModalDateBackBtn.classList.add(this.dateBackBtnDisabledClass);
        this.$pickerModalDateBackBtn.removeEventListener('click', e => this.handleClickDateBackBtn(e));
      }

      if (data && data.length === 1) {
        defaultText = DATEPICKER_TEXT_FROM;
        this.changeFocusField();
      } else {
        defaultText = DATEPICKER_TEXT_TO;
      }
    } else if ($el.classList.contains(this.dateToClass)) {
      defaultText = DATEPICKER_TEXT_FROM;
      this.$pickerModalDateBackBtn.classList.remove(this.dateBackBtnDisabledClass);
      this.$pickerModalDateBackBtn.addEventListener('click', e => this.handleClickDateBackBtn(e));
    }

    this.$pickerModalTitle.textContent = defaultText;
  };

  changeFocusField = () => {
    this.$dateFrom.classList.remove(this.focusedClass);
    this.$dateTo.classList.add(this.focusedClass);
    if (this.$dateTo.classList.contains(this.yellowClass)) this.$dateToLabel.classList.add(this.visibleClass);
  };

  checkBackBtn = () => {
    if (this.$pickerModalDateBackBtn.classList.contains(this.dateBackBtnDisabledClass)) {
      this.$pickerModalDateBackBtn.classList.remove(this.dateBackBtnDisabledClass);
    }

    this.$pickerModalDateBackBtn.addEventListener('click', e => this.handleClickDateBackBtn(e));
  };

  handleClickDateBackBtn = e => {
    e.preventDefault();

    if (this.dates.inputDates.length > 1 && this.dates.searchDates.length > 1) {
      this.dates.inputDates.pop();
      this.dates.searchDates.pop();

      this.datepicker.getCalendarInstance.setDate(this.dates.searchDates[0]);

      this.onPick(this.dates);
    }

    this.$dateToInput.value = 'Не нужен';

    this.handleCloseModal();
  };

  enableBackBtnFromLocalStorage = () => {
    this.$pickerModalDateBackBtn.classList.remove(this.dateBackBtnDisabledClass);
    this.checkBackBtn();
  };

  disableFieldError = () => {
    if (this.$dateFrom.classList.contains(this.incorrectClass)) {
      this.$dateFrom.classList.remove(this.incorrectClass);
    }
  };

  // Mobile events
  initMobileCalendar = () => {
    this.handleCloseBtnMobile();
    if (this.$pickerModal.classList.contains(this.openModalClass)) {
      this.disableOverflowOnMobile();
    }
  };

  handleCloseBtnMobile = () => {
    this.$closeBtn.addEventListener('click', () => {
      this.handleCloseModal();
    });
  };

  disableOverflowOnMobile = () => {
    const mobile = this.windowWidth <= this.MAX_MIDTH;

    if (mobile) {
      this.$htmlAndBody.forEach($elem => $elem.classList.add(this.limitedClass));
    } else {
      this.$htmlAndBody.forEach($elem => $elem.classList.remove(this.limitedClass));
    }
  };

  blurField = () => {
    [this.$dateFrom, this.$dateTo].forEach($el => {
      $el.addEventListener(
        'click',
        e => {
          const { currentTarget } = e;

          [this.$dateFrom, this.$dateTo].forEach($elem => $elem.classList.remove(this.focusedClass));
          currentTarget.classList.remove(this.focusedClass);
        },
        true,
      );
    });
  };

  clickOutside = (className, notarget) => {
    document.addEventListener('click', e => {
      const { target } = e;

      const $el = document.querySelector(`.${className}`);

      if ($el && !$el.contains(target) && !target.closest(`.${notarget}`)) {
        if (window.innerWidth > 767) {
          this.handleCloseModal();
        }
      }
    });
  };

  get getDateFromInstance() {
    return this.dateFromInstance;
  }
}
