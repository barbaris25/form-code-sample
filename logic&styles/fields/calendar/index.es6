import throttle from 'lodash-es/throttle';

export default class Calendar {
  constructor(elem, options) {
    this.$elem = elem;
    this.$bottomWrap = document.querySelector('.js-float-wrap');

    // Callbacks & outside options
    this.onChangeCallback = options.onChange || null;
    this.localDates = options.localDates || [];

    // Default flatpickr options
    this.defaultOptions = {
      inline: true,
      minDate: 'today',
      showMonths: window.innerWidth <= 1023 ? 1 : 2,
      monthSelectorType: 'static',
      prevArrow:
        '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M6.375 1.76468L2.45773 6.00023L6.375 10.2358L5.16684 11.5418L1.04641 7.08661C0.479265 6.47339 0.479265 5.52708 1.04641 4.91386L5.16697 0.458496L6.375 1.76468Z" fill="#212121"/></svg>',
      nextArrow:
        '<svg width="7" height="12" viewBox="0 0 7 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M0.625 10.2353L4.54227 5.99977L0.625 1.76421L1.83316 0.45817L5.95359 4.91339C6.52073 5.52661 6.52073 6.47292 5.95359 7.08614L1.83303 11.5415L0.625 10.2353Z" fill="#212121"/></svg>',
    };

    // All flatpickr options
    this.options =
      {
        ...this.defaultOptions,
        mode: options.mode || 'single',
        formatTemplate: options.formatTemplate || 'd-m-Y',
      } || {};

    // local calendar instance
    this.calendarInstance = null;
    this.visibleClass = 'visible';

    // Init
    this.init();
  }

  init = () => {
    this.initCalendar(this.options);
  };

  initCalendar = options => {
    Promise.all([
      import(/* webpackChunkName: "flatpickr" */ 'flatpickr'),
      import(/* webpackChunkName: "russian" */ 'flatpickr/dist/l10n/ru'),
      import(/* webpackChunkName: "flatpickr css" */ 'flatpickr/dist/flatpickr.min.css'),
      import(/* webpackChunkName: "flatpickr custom theme" */ './flatpickr-theme.css'),
    ]).then(([{ default: Flatpickr }, { Russian }]) => {
      Flatpickr.localize(Russian);

      if (this.$elem) {
        setTimeout(() => {
          // Clear loader
          this.$elem.textContent = '';

          // Insert calendar to the DOM
          this.calendarInstance = new Flatpickr(this.$elem, {
            locale: Russian,
            appendTo: this.$elem,
            ...options,
            onChange: selectedDates => {
              this.onChangeCallback(selectedDates);
            },
          });

          if (this.$bottomWrap) this.$bottomWrap.classList.add(this.visibleClass);

          if (this.localDates[0]) {
            setTimeout(() => {
              this.calendarInstance.setDate(this.localDates);
              this.calendarInstance.jumpToDate(this.localDates[0]);
            }, 0);
          }

          this.setupDatesFromLocalStorage(this.localDates);
          this.windowResize();
        }, 500);
      }
    });
  };

  windowResize = () => {
    window.addEventListener(
      'resize',
      throttle(() => {
        const windowWidth = window.innerWidth;

        if (this.calendarInstance) {
          if (windowWidth <= 1023) {
            this.calendarInstance.set('showMonths', 1);
          } else {
            this.calendarInstance.set('showMonths', 2);
          }
        }
      }, 250).bind(this),
    );
  };

  setupDatesFromLocalStorage = dates => {
    if (dates[0]) this.calendarInstance.setDate(dates);
  };

  get getCalendarInstance() {
    return this.calendarInstance;
  }
}
