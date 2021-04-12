import axios from '~/loaders/axios';
import { hightlightText } from '~/helpers';
import { getMarker } from '~/search-form/app/helpers/marker';
import listItem from '../list-items/listItem.pug';
import DefaultForm from '../default-form';
import AutocompleteField from '../fields/autocomplete';
import DoubleDateFields from '../fields/double-date-fields';
import PassengerField from '../fields/passenger-field';
import FormValidation from '../form-validation';

// Import avia themes
import '../themes/avia';

class AviaForm extends DefaultForm {
  constructor($form) {
    super($form);

    this.listItem = listItem;
    this.baseUrl = '/flights/redirect';

    // Form wrap
    this.$form = $form;
    this.$dateDouble = this.$form.querySelectorAll('.js-date-double');
    this.$passField = this.$form.querySelector('.js-passengers');

    // Tooglers
    this.$aviaSales = document.querySelector('.js-aviasales') || null;
    this.$skyScanner = document.querySelector('.js-skyscanner') || null;
    this.$aviaSalesInput = null;
    this.$skyScannerInput = null;

    // Avia variables
    this.passengers = null;
    this.isOpenAviasales = false;
    this.isOpenSkyscanner = false;

    // Instances
    this.autocompleteFromInstance = null;
    this.autocompleteToInstance = null;
    this.doubleDateFieldsInstance = null;
    this.dateFromInstance = null;
    this.dateToInstance = null;
    this.vaidationInstance = null;
    this.passengersInstance = null;

    this.init();
  }

  init = () => {
    this.getDefaultData('avia-search-form-data', [
      'from',
      'to',
      'dateFrom',
      'dateTo',
      'passengers',
      'isOpenAviasales',
      'isOpenSkyscanner',
    ]);

    this.initFields();
    this.initValidation();
    this.sendData();
  };

  // Init all fields
  initFields = () => {
    if (this.$fieldFrom) {
      this.autocompleteFromInstance = this.createAutocomplete(this.$fieldFrom, {
        placeholder: {
          desktop: 'Москва',
          mobile: 'Откуда',
        },
        resultsLength: 5,
        storageValue: this.from || null,
        onPick: city => {
          this.from = city;
          this.updateValidation(0, this.from);
        },
      });
    }

    if (this.$fieldTo) {
      this.autocompleteToInstance = this.createAutocomplete(this.$fieldTo, {
        placeholder: {
          desktop: 'Санкт-Петербург',
          mobile: 'Куда',
        },
        storageValue: this.to || null,
        onPick: city => {
          this.to = city;
          this.updateValidation(1, this.to);
        },
      });
    }

    if (Array.from(this.$dateDouble).length === 2) {
      this.doubleDateFieldsInstance = this.createCalendar(this.$form, {
        fieldFrom: {
          elem: this.$dateFrom,
          options: {
            storageValue: this.dateFrom || null,
            disableSelect: true,
            placeholder: {
              desktop: 'Дата',
              mobile: 'Туда',
            },
          },
        },

        fieldTo: {
          elem: this.$dateTo,
          options: {
            storageValue: this.dateTo || null,
            disableSelect: true,
            placeholder: {
              desktop: 'Дата',
              mobile: 'Обратно',
            },
          },
        },
      });

      this.dateFromInstance = this.doubleDateFieldsInstance.getDateFromInstance;
    }

    if (this.$passField) {
      this.passengersInstance = this.createPassengers(this.$passField, {
        storageValue: this.passengers || null,
        disableSelect: true,
        isToggleFocus: true,
      });
    }

    this.initTogglers();
  };

  // Create autocomplete
  createAutocomplete = (el, options) =>
    new AutocompleteField(el, {
      url: this.autocompleteURL,
      successDataCallback: (data, query) => {
        let html = '';

        data.forEach(item => {
          const renderData = {
            city: item.name,
            country: item.country_name,
            type: item.type,
            code: item.id_data.hash.code,
            text: hightlightText(query, item),
          };

          html += this.listItem({ data: renderData });
        });
        return html;
      },
      ...options,
    });

  // Create calendar
  createCalendar = (elem, options) =>
    new DoubleDateFields(elem, {
      readonly: true,
      formatTemplate: 'd-m-Y',
      mode: 'range',
      localSelectedDates: [this.dateFrom, this.dateTo],
      onPick: date => {
        const { inputDates, searchDates } = date;

        if (inputDates) {
          const [inputFrom, inputTo] = inputDates;

          this.$inputDateFrom.value = inputFrom || null;
          this.$inputDateTo.value = inputTo || null;
        }

        if (searchDates) {
          const [searchDateFrom, searchDateTo] = searchDates;

          this.dateFrom = searchDateFrom || null;
          this.dateTo = searchDateTo || null;

          this.updateValidation(2, this.dateFrom);
        }
      },
      ...options,
    });

  // Create passengers
  createPassengers = (el, options) =>
    new PassengerField(el, {
      ...options,
      localPassengers: this.passengers,
      readonly: true,
      onPick: obj => {
        this.passengers = obj;
      },
    });

  // Init form validation
  initValidation = () => {
    this.vaidationInstance = new FormValidation(this.$form, [
      {
        id: 0,
        isValid: false,
        instance: this.autocompleteFromInstance,
        value: this.from,
      },

      {
        id: 1,
        isValid: false,
        instance: this.autocompleteToInstance,
        value: this.to,
      },

      {
        id: 2,
        isValid: false,
        instance: this.dateFromInstance,
        value: this.dateFrom,
      },

      {
        id: 3,
        isValid: false,
        instance: this.passengersInstance,
        value: this.passengers,
      },
    ]);
  };

  // Form validation
  sendData = () => {
    this.$form.addEventListener('submit', e => {
      e.preventDefault();

      this.validateForm();
    });
  };

  validateForm = () => {
    if (this.vaidationInstance.isValidForm) {
      this.insertDataToLocalStorage();

      const marker = getMarker(null, {
        short: false,
        number: true,
        useReferer: this.pageType === 'seo',
        isHintRoute: this.pageType === 'HintRoute',
      });

      const reqBody = {
        from: this.from.id_data,
        to: this.to.id_data,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        options: JSON.parse(this.submitOptions),
        passengers: this.passengers,
        aviasales: this.isOpenAviasales,
        skyscanner: this.isOpenSkyscanner,
        marker,
      };

      axios
        .post(this.baseUrl, {
          ...reqBody,
        })
        .then(res => {
          if (this.pageType) this.setTarget();

          if (typeof res.data.redirect === 'string') {
            if (res.data.new_tab) {
              window.open(res.data.new_tab);
            }
            window.location.href = res.data.redirect;
          } else {
            throw new Error('Ошибка получения ссылки для редиректа!');
          }
        });
    }
  };

  updateValidation = (id, val) => {
    this.vaidationInstance.updateValue(id, val);
  };

  // Avia Goals
  setTarget = () => {
    switch (this.pageType) {
      case 'home':
        window.goal('home_searchclick_flights');
        break;
      case 'landing':
        window.goal('home_landiпg_search_flights');
        break;
      case 'seo':
        window.goal('flights_city2city');
        break;
      // TODO: Добавить цели на questions
      default:
        break;
    }
  };

  // Local Storage methods
  insertDataToLocalStorage = () => {
    localStorage.setItem('avia-search-form-data', JSON.stringify(this.generateStorageData()));
  };

  generateStorageData = () => ({
    from: this.from,
    to: this.to,
    dateFrom: this.dateFrom,
    dateTo: this.dateTo,
    passengers: this.passengers,
    isOpenAviasales: this.isOpenAviasales,
    isOpenSkyscanner: this.isOpenSkyscanner,
  });

  // Tooglers
  initTogglers = () => {
    if (this.$aviaSales) {
      this.$aviaSalesInput = this.$aviaSales.querySelector('.form-checkbox__input') || null;
      this.$skyScannerInput = this.$skyScanner.querySelector('.form-checkbox__input') || null;

      if (this.isOpenAviasales) this.$aviaSalesInput.checked = true;

      this.$aviaSales.addEventListener('click', e => {
        e.preventDefault();
        this.isOpenAviasales = !this.isOpenAviasales;
        this.$aviaSalesInput.checked = this.isOpenAviasales;
      });
    }

    if (this.$skyScanner) {
      if (this.isOpenSkyscanner) this.$skyScannerInput.checked = true;

      this.$skyScanner.addEventListener('click', e => {
        e.preventDefault();
        this.isOpenSkyscanner = !this.isOpenSkyscanner;
        this.$skyScannerInput.checked = this.isOpenSkyscanner;
      });
    }
  };
}

// Init avia form
(() => {
  const $avia = document.querySelector('.js-avia-form');
  if ($avia) {
    (() => new AviaForm($avia))();
  }
})();
