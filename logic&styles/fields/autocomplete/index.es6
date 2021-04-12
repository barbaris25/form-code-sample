import axios, { CancelToken } from 'axios';
import debounce from 'lodash-es/debounce';
import throttle from 'lodash-es/throttle';
import { clickOutsideElByClass } from '~/helpers';
import BaseField from '../base-field';
import './autocomplete.sass';

export default class AutocompleteField extends BaseField {
  constructor(elem, options) {
    const baseOptions = {
      ...options,
      onInputCallback: debounce(e => this.getCitiesFromJSON(e.target.value), 200, { leading: true }),
    };

    super(elem, baseOptions);

    this.defaultValue = options.storageValue || null;
    this.url = options.url || '';
    this.resultsLength = options.resultsLength || 6;
    this.successDataCallback = options.successDataCallback;
    this.onPick = options.onPick;

    // Html elems
    this.$bodyAndHtml = document.querySelectorAll(`body, html, .wrapper`);
    this.$dropdown = this.$elem.querySelector('.js-autocomplete');
    this.$dropdownList = this.$elem.querySelector('.js-autocomplete__dropdown-list');
    this.$modalCloseBtn = this.$dropdown.parentElement.querySelector('.js-close');
    this.$dropdownListItems = null;

    // Variables
    this.activeListIndex = null;
    this.cancel = null;
    this.data = null;
    this.selectedCity = null;
    this.blockBlur = false;
    this.MAX_MOBILE_WIDTH = 767;

    this.dropdownVisibleClass = 'field-autocomplete--visible';
    this.activeMobileDropdownClass = 'js-mobile-open';
    this.hoveredClass = 'hovered';
    this.focusedClass = 'focused';
    this.dropdownClass = 'dropdown-open';
    this.limitedClass = 'comm-limited';

    this.init();
  }

  init = () => {
    this.initMobileAutocomplete();
    this.resizeWindowWidth();
    this.blurField();
    if (this.defaultValue) this.setValue(this.defaultValue.name);
  };

  resizeWindowWidth = () => {
    window.addEventListener(
      'resize',
      throttle(() => {
        if (window.innerWidth <= this.MAX_MOBILE_WIDTH) {
          this.initMobileAutocomplete();
          this.blurField();
        } else {
          this.destroyMobileModal();
        }
      }, 200).bind(this),
    );
  };

  getCitiesFromJSON = query => {
    if (query) {
      if (this.cancel) {
        this.cancel();
        this.cancel = null;
      }

      axios
        .get(this.url, {
          params: {
            query,
          },
          cancelToken: new CancelToken(c => {
            this.cancel = c;
          }),
        })
        .then(data => {
          const axiosData = data.data;

          if (axiosData.length) {
            this.data = axiosData.slice(0, this.resultsLength);
            this.createList(this.successDataCallback(this.data, query));
          } else if (axiosData.length === 0) {
            this.data = [{ country_name: null, id_data: null, name: '' }];
            this.createList(this.successDataCallback(this.data));
          }
        })
        .catch(e => {
          if (axios.isCancel(e)) {
            console.log('Request canceled', e.message);
          } else {
            console.log(e);
          }
        });
    } else {
      this.resetList();
    }
  };

  createList = html => {
    this.resetList();

    this.selectedCity = null;

    if (html) {
      this.$dropdownList.insertAdjacentHTML('beforeend', html);
      this.$dropdown.classList.add(this.dropdownVisibleClass);
      this.$elem.classList.add(this.dropdownClass);
      this.$dropdownListItems = this.$dropdownList.querySelectorAll('.js-autocomplete__dropdown-item');
      this.initAutocompleteHandlers();
    }
  };

  resetList = () => {
    this.$dropdownList.textContent = '';
    this.activeListIndex = null;
    this.$dropdown.classList.remove(this.dropdownVisibleClass);
    this.$elem.classList.remove(this.dropdownClass);
    this.$input.removeEventListener('keydown', this.keyCodes);
  };

  // Init handlers
  initAutocompleteHandlers = () => {
    this.clickHandler();
    this.keyboardHandler();
    this.clickOutsideHandler();
  };

  clickHandler = () => {
    const clickFunc = i => {
      if (!this.blockBlur) {
        this.selectItem(i);
        this.selectedCity = this.selectItem(i);
      }
    };

    this.$dropdownListItems.forEach((item, i) => {
      item.addEventListener('mousedown', () => clickFunc(i));
      item.addEventListener('click', () => {
        clickFunc(i);
      });
    });
  };

  clickOutsideHandler = () => {
    clickOutsideElByClass('js-autocomplete', () => {
      if (this.data && window.innerWidth > this.MAX_MOBILE_WIDTH) {
        this.selectItem(0);
      }
    });
  };

  // Keyboard events
  keyboardHandler = () => {
    this.$input.addEventListener('keydown', this.keyCodes);
  };

  keyCodes = e => {
    if (this.$dropdownListItems.length) {
      if (e.keyCode === 40) {
        this.incrementList();
      } else if (e.keyCode === 38) {
        this.decrementList();
      } else if (e.keyCode === 13) {
        e.preventDefault();
        this.selectItem(this.activeListIndex);
        this.selectedCity = null;
      } else if (e.keyCode === 9) {
        if (this.activeListIndex) {
          this.selectItem(this.activeListIndex);
        } else {
          this.selectItem(0);
        }
        this.selectedCity = null;
      }
    }
  };

  selectItem = index => {
    if (!this.data) return false;
    const activeItem = this.data[index];
    this.$input.value = activeItem.name;
    this.onPick(activeItem);
    this.resetList();
    this.data = null;
    this.$elem.classList.remove(this.focusedClass);

    if (window.innerWidth <= this.MAX_MOBILE_WIDTH) {
      this.destroyMobileModal();
    } else {
      setTimeout(() => {
        const $nextEl = this.$elem.nextElementSibling;
        const $nextElInput = $nextEl.querySelector('.js-input');
        if (!$nextElInput.value) {
          $nextEl.classList.add(this.focusedClass);
          $nextElInput.select();
        }
      }, 200);
    }

    return activeItem;
  };

  onSelectItem = index => {
    this.activeListIndex = index;

    this.$dropdownListItems.forEach(item => {
      item.classList.remove(this.hoveredClass);
    });

    this.$dropdownListItems[this.activeListIndex].classList.add(this.hoveredClass);
  };

  incrementList = () => {
    if (this.activeListIndex === null) {
      this.activeListIndex = 0;
      this.onSelectItem(this.activeListIndex);
    } else if (this.activeListIndex < this.$dropdownListItems.length - 1) {
      this.onSelectItem(this.activeListIndex + 1);
    } else {
      this.activeListIndex = 0;
      this.onSelectItem(this.activeListIndex);
    }
  };

  decrementList = () => {
    if (this.activeListIndex > 0) {
      this.onSelectItem(this.activeListIndex - 1);
    } else {
      this.activeListIndex = this.$dropdownListItems.length - 1;
      this.onSelectItem(this.activeListIndex);
    }
  };

  // Mobile methods
  initMobileAutocomplete = () => {
    const mobile = window.innerWidth <= this.MAX_MOBILE_WIDTH;

    if (mobile) {
      this.initMobileEvents();
    } else {
      this.destroyMobileModal();
    }
  };

  initMobileEvents = () => {
    this.$elem.querySelector('.js-control').addEventListener('click', () => {
      if (window.innerWidth <= this.MAX_MOBILE_WIDTH) this.initMobileModal();
    });
  };

  removeMobileEvents = () => {
    this.$modalCloseBtn.removeEventListener('click', this.destroyMobileModal);
    this.$elem.querySelector('.js-control').removeEventListener('click', this.destroyMobileModal);
  };

  initMobileModal = () => {
    this.$bodyAndHtml.forEach(elem => elem.classList.add(this.limitedClass));

    // Add active class for modal
    this.$elem.classList.add(this.activeMobileDropdownClass);
    this.showCloseBtn();
  };

  showCloseBtn() {
    this.$modalCloseBtn.style.display = 'block';
    this.$modalCloseBtn.addEventListener('click', () => this.destroyMobileModal());
  }

  destroyMobileModal = () => {
    this.$bodyAndHtml.forEach(elem => {
      elem.classList.remove(this.limitedClass);
    });

    this.$modalCloseBtn.style.display = 'none';
    this.$elem.classList.remove(this.activeMobileDropdownClass);
    if (!this.selectedCity) this.selectItem(0);
    this.removeMobileEvents();
  };

  blurField = () => {
    this.$elem.addEventListener(
      'blur',
      e => {
        const { target } = e;

        if (window.innerWidth > this.MAX_MOBILE_WIDTH) {
          if (target && !this.$elem.contains(target)) {
            this.selectItem(0);
          }

          if (target && this.$elem.contains(target)) {
            this.$elem.classList.remove(this.focusedClass);
          }
        }
      },
      true,
    );
  };

  // Getters
  get getDefaultData() {
    return this.$input.getAttribute('data-default');
  }
}
