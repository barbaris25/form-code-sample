import isFuture from 'date-fns/isFuture';
import isToday from 'date-fns/isToday';

export default class DefaultForm {
  constructor($form) {
    this.$form = $form;

    // Form fields
    this.$fieldFrom = this.$form.querySelector('.js-field-from');
    this.$fieldTo = this.$form.querySelector('.js-field-to');
    this.$dateFrom = this.$form.querySelector('.js-date-from');
    this.$dateTo = this.$form.querySelector('.js-date-to');

    // Form fields inner inputs
    this.$inputFrom = this.$fieldFrom.querySelector('.js-input');
    this.$inputTo = this.$fieldTo.querySelector('.js-input');
    this.$inputDateFrom = this.$dateFrom.querySelector('.js-input');
    this.$inputDateTo = this.$dateTo.querySelector('.js-input');
    this.$dataChanger = this.$fieldFrom.querySelector('.js-changer');

    // Form vars
    this.from = null;
    this.to = null;
    this.dateFrom = null;
    this.dateTo = null;
    this.pageType = null;
    this.autocompleteURL = null;
    this.submitOptions = null;

    // Classes
    this.incorrectClass = 'incorrect';
    this.visibleClass = 'visible';
    this.yellowClass = 'new-search-forms--yellow';
    this.questionClass = 'new-search-forms--questions';
    this.labelClass = 'js-label';

    this.init();
  }

  init = () => {
    this.initDataMethods();
  };

  // Work with data
  initDataMethods = () => {
    this.rotateData();
  };

  getDefaultData = (name, fields) => {
    this.getFormAttributes();

    const dataFromInput = this.getDataFromElement(this.$inputFrom, 'data-default');
    const dataToInput = this.getDataFromElement(this.$inputTo, 'data-default');

    if (dataFromInput) this.from = dataFromInput;
    if (dataToInput) this.to = dataToInput;

    if (!dataToInput) {
      this.getDataFromLocalStorage(name, fields);
    }
  };

  getFormAttributes = () => {
    this.autocompleteURL = this.$form.getAttribute('data-autocomplete-url') || '/api/site/search/all_transport.json';
    this.submitOptions = this.$form.getAttribute('data-submit-options') || {};
    this.pageType = this.$form.getAttribute('data-form-type');
  };

  getDataFromLocalStorage = (key, fields) => {
    let storageData = localStorage.getItem(key);

    if (storageData) {
      storageData = JSON.parse(storageData);

      fields.forEach(fkey => {
        if (!this[fkey]) this[fkey] = storageData[fkey];
      });
    }

    // Set visible label on yellow form or questions
    if (this.$form.classList.contains(this.yellowClass) || this.$form.classList.contains(this.questionClass)) {
      if (this.from) {
        this.$fieldFrom.querySelector(`.${this.labelClass}`).classList.add(this.visibleClass);
      }

      if (this.to) {
        this.$fieldTo.querySelector(`.${this.labelClass}`).classList.add(this.visibleClass);
      }

      if (this.dateFrom) {
        this.$dateFrom.querySelector(`.${this.labelClass}`).classList.add(this.visibleClass);
      }

      if (this.dateTo) {
        this.$dateTo.querySelector(`.${this.labelClass}`).classList.add(this.visibleClass);
      }
    }

    this.checkValidLocalDates(this.dateFrom);
  };

  checkValidLocalDates = date => {
    if (!isFuture(new Date(date)) && !isToday(new Date(date))) {
      this.dateFrom = null;
      this.dateTo = null;
    }
  };

  getDataFromElement = (el, data) => {
    const dataDefault = el.getAttribute(data);
    let parsed = null;

    if (dataDefault) parsed = JSON.parse(dataDefault);

    return parsed;
  };

  // Rotate data
  rotateData = () => {
    if (this.$dataChanger) {
      this.$dataChanger.addEventListener('click', () => {
        const tmp = this.$inputFrom.value;
        this.$inputFrom.value = this.$inputTo.value;
        this.$inputTo.value = tmp;

        if (this.from || this.to) {
          const tmpData = this.from;
          this.from = this.to;
          this.to = tmpData;
        }

        this.updateValidation(0, this.from);
        this.updateValidation(1, this.to);

        // Terms to rotate error field
        if (
          this.$fieldFrom.classList.contains(this.incorrectClass) &&
          !this.$fieldTo.classList.contains(this.incorrectClass)
        ) {
          this.autocompleteFromInstance.setCorrectField();
          this.autocompleteToInstance.setIncorrectField();
        } else if (
          !this.$fieldFrom.classList.contains(this.incorrectClass) &&
          this.$fieldTo.classList.contains(this.incorrectClass)
        ) {
          this.autocompleteFromInstance.setIncorrectField();
          this.autocompleteToInstance.setCorrectField();
        }
      });
    }
  };
}
