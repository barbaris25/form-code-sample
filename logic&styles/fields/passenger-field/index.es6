import throttle from 'lodash-es/throttle';
import BaseField from '../base-field';
import Counter from '../counter';
import { pluralize, clickOutsideElByClass } from '~/helpers';
import './passenger-field.sass';

const MAX_MOBILE_WIDTH = 767;

export default class PassengerField extends BaseField {
  constructor(elem, options) {
    const baseOptions = {
      ...options,
      readonly: true,
    };

    super(elem, baseOptions);

    // Parents options
    this.onPick = options.onPick || null;
    this.storageValue = options.storageValue || null;

    // Html elems
    this.$elem = elem;
    this.$control = this.$elem.querySelector('.js-control');
    this.$closeModalBtn = this.$elem.querySelector('.js-close');
    this.$wrappers = document.querySelectorAll(`body, html, .wrapper`);

    // Counter elems
    this.$adultsCounter = this.$elem.querySelector('.js-adults');
    this.$chTo12Counter = this.$elem.querySelector('.js-children-to-12');
    this.$chTo2Counter = this.$elem.querySelector('.js-children-to-2');

    // Instances
    this.adultsInstanse = null;
    this.childrenInstanse = null;
    this.infantsInstanse = null;

    // Variables
    this.isOpenModal = false;
    this.windowWidth = window.innerWidth;
    this.adultsCount = 1;
    this.childrenCount = 0;
    this.infantsCount = 0;
    this.totalCount = this.adultsCount + this.childrenCount + this.infantsCount;
    this.maxPassLimit = 9;
    this.typeClass = 0; // Economy = 0, Business = 1

    // Classes
    this.passClass = 'js-passengers';
    this.openClass = 'passenger-field__open';
    this.activeClass = 'active';
    this.tabClass = 'js-tab';
    this.limitedClass = 'comm-limited';

    this.init();
  }

  init = () => {
    this.initLocalData();
    this.initModal();
    this.resizeWindow();
  };

  // resize window
  resizeWindow = () => {
    window.addEventListener(
      'resize',
      throttle(() => {
        this.windowWidth = window.width;
      }, 200).bind(this),
    );
  };

  // Init local data
  initLocalData = () => {
    this.initFields();
    this.initCounterLogic();

    if (this.storageValue) {
      this.initTabs(this.storageValue.type);
    } else {
      this.initTabs();
    }
  };

  // Check local data and return passanger value
  checkLocalData = (dataName, defaultData) => {
    const local = this.storageValue;
    let result = null;

    if (local) {
      result = local[dataName];
      this[`${dataName}Count`] = local[dataName];
    } else {
      result = defaultData;
    }

    return result;
  };

  // Modal init
  initModal = () => {
    this.handleModal();
  };

  // Counters init
  initFields = () => {
    if (this.$adultsCounter) {
      this.adultsInstanse = this.createAdultsCounter(this.$adultsCounter, {
        count: this.checkLocalData('adults', this.adultsCount),
        minLimit: 1,
        maxLimit: this.maxPassLimit,
      });
    }

    if (this.$chTo12Counter) {
      this.childrenInstanse = this.createChildrenCounter(this.$chTo12Counter, {
        count: this.checkLocalData('children', this.childrenCount),
        minLimit: 0,
        maxLimit: this.maxPassLimit,
      });
    }

    if (this.$chTo2Counter) {
      this.infantsInstanse = this.createInfantsCounter(this.$chTo2Counter, {
        count: this.checkLocalData('infants', this.infantsCount),
        minLimit: 0,
        maxLimit: this.maxPassLimit,
      });
    }

    if (this.storageValue) {
      const values = Object.values(this.storageValue);
      values.pop();

      /* eslint-disable no-param-reassign */
      // eslint-disable-next-line no-return-assign
      this.totalCount = values.reduce((sum, value) => (sum += value), 0);

      this.updateTotalPass(this.totalCount);
    }
  };

  // Create counters
  createAdultsCounter = (elem, options) =>
    new Counter(elem, {
      ...options,
      onPick: count => {
        this.adultsCount = count;
        this.updateTotalPass();
      },
    });

  createChildrenCounter = (elem, options) =>
    new Counter(elem, {
      ...options,
      onPick: count => {
        this.childrenCount = count;
        this.updateTotalPass();
      },
    });

  createInfantsCounter = (elem, options) =>
    new Counter(elem, {
      ...options,
      onPick: count => {
        this.infantsCount = count;
        this.updateTotalPass();
      },
    });

  // init logic
  initCounterLogic = () => {
    this.pluralizePass(this.totalCount);
  };

  // Update total passenger
  updateTotalPass = number => {
    this.totalCount = number || this.adultsCount + this.childrenCount + this.infantsCount;

    if (this.totalCount >= this.maxPassLimit) {
      [this.adultsInstanse, this.childrenInstanse, this.infantsInstanse].forEach(instance => instance.disableButtons());
    } else {
      [this.adultsInstanse, this.childrenInstanse, this.infantsInstanse].forEach(instance => instance.enableButtons());
    }

    this.pluralizePass(this.totalCount);
    this.generatePassengerObj();
  };

  // Get total sum of passengers
  pluralizePass = num => {
    const pluralized = pluralize(num, ['пассажир', 'пассажирa', 'пассажиров']);
    this.setValue(`${num} ${pluralized}`);
  };

  // Generate object field
  generatePassengerObj = () => {
    const obj = {
      adults: this.adultsInstanse.returnCount,
      children: this.childrenInstanse.returnCount,
      infants: this.infantsInstanse.returnCount,
      type: this.typeClass,
    };

    if (this.onPick) {
      this.onPick(obj);
    }

    return obj;
  };

  // Modal
  handleModal = () => {
    this.$control.addEventListener('click', () => this.toggleModal());

    this.$closeModalBtn.addEventListener('click', () => {
      if (this.$elem.classList.contains(this.openClass)) {
        this.toggleModal();
      }
    });

    this.clickOutsideHandler();
    this.initTabs();
  };

  clickOutsideHandler = () => {
    clickOutsideElByClass(this.passClass, () => {
      this.$elem.classList.remove(this.openClass, this.focusedClass);
      this.isOpenModal = false;
    });
  };

  toggleModal = () => {
    if (this.isOpenModal) {
      this.isOpenModal = false;
      this.toggleOverfowScroll();
      this.$elem.classList.remove(this.openClass, this.focusedClass);
    } else {
      this.isOpenModal = true;
      this.toggleOverfowScroll();
      this.$elem.classList.add(this.openClass, this.focusedClass);
    }
  };

  toggleOverfowScroll = () => {
    if (this.windowWidth < MAX_MOBILE_WIDTH) {
      if (this.isOpenModal) {
        this.$wrappers.forEach($el => $el.classList.add(this.limitedClass));
      } else {
        this.$wrappers.forEach($el => $el.classList.remove(this.limitedClass));
      }
    }
  };

  // Class Tabs
  initTabs = localData => {
    const $tabs = this.$elem.querySelectorAll(`.${this.tabClass}`);

    // Set active tab
    $tabs.forEach(tab => {
      if (localData === 0 && tab.getAttribute('data-class') === 'economy') {
        $tabs.forEach(tabe => tabe.classList.remove(this.activeClass));
        tab.classList.add(this.activeClass);
        this.typeClass = 0;
      } else if (localData === 1 && tab.getAttribute('data-class') === 'business') {
        $tabs.forEach(tabe => tabe.classList.remove(this.activeClass));
        tab.classList.add(this.activeClass);
        this.typeClass = 1;
      }

      this.generatePassengerObj();

      tab.addEventListener('click', e => {
        const { target } = e;

        if (target && !target.classList.contains(this.activeClass)) {
          $tabs.forEach($tab => {
            $tab.classList.remove(this.activeClass);
          });

          if (target.getAttribute('data-class') === 'economy') {
            this.typeClass = 0;
          } else {
            this.typeClass = 1;
          }

          this.generatePassengerObj();
          target.classList.add(this.activeClass);
        }
      });
    });
  };
}
