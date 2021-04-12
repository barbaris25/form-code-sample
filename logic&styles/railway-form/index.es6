import axios from '~/loaders/axios';
import listItem from '../list-items/listItem.pug';
import listItemEmpty from '../list-items/listItem-empty.pug';
import { hightlightText } from '~/helpers';
import DefaultForm from '../default-form';
import AutocompleteField from '../fields/autocomplete';
import DoubleDateFields from '../fields/double-date-fields';
import FormValidation from '../form-validation';

// Import theme
import '../themes/railway';

class RailwayForm extends DefaultForm {
  constructor($form) {
    super($form);

    this.listItem = listItem;
    this.listItemEmpty = listItemEmpty;
    this.baseUrl = '/railway/redirect';

    // Form wrap
    this.$form = $form;
    this.$dateDouble = this.$form.querySelectorAll('.js-date-double');
    this.$schedule = document.querySelector('.schedule');

    // Instances
    this.autocompleteFromInstance = null;
    this.autocompleteToInstance = null;
    this.doubleDateFieldsInstance = null;
    this.dateFromInstance = null;
    this.dateToInstance = null;
    this.vaidationInstance = null;

    this.init();
  }

  init = () => {
    this.getDefaultData('railway-search-form-data', ['from', 'to', 'dateFrom', 'dateTo']);
    this.initFields();
    this.initValidation();
    this.sendData();
  };

  // Init all fields
  initFields = () => {
    if (this.$fieldFrom) {
      this.autocompleteFromInstance = this.createAutocomplete(this.$fieldFrom, {
        placeholder: {
          desktop: 'Город отбытия',
          mobile: 'Откуда',
        },
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
          desktop: 'Город прибытия',
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
            placeholder: {
              desktop: 'Дата',
              mobile: 'Обратно',
            },
          },
        },
      });

      this.dateFromInstance = this.doubleDateFieldsInstance.getDateFromInstance;
    }
  };

  // Create autocomplete
  createAutocomplete = (el, options) =>
    new AutocompleteField(el, {
      url: this.autocompleteURL,
      successDataCallback: (data, query) => {
        let html = '';

        if (data && query) {
          data.forEach(item => {
            const renderData = {
              city: item.name,
              country: item.country_name,
              text: hightlightText(query, item),
            };
            html += this.listItem({ data: renderData });
          });
        } else {
          html = this.listItemEmpty();
        }

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

          if (this.$schedule) {
            window.changeDateFromField(this.dateFrom);
          }

          this.updateValidation(2, this.dateFrom);
        }
      },
      ...options,
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

      const reqBody = {
        from: this.from.id_data,
        to: this.to.id_data,
        dateFrom: this.dateFrom,
        dateTo: this.dateTo,
        options: JSON.parse(this.submitOptions),
      };

      axios
        .post(this.baseUrl, {
          ...reqBody,
        })
        .then(res => {
          if (this.pageType) this.setTarget();

          if (res.data.location) {
            window.location.href = res.data.location;
          } else {
            throw new Error('Ошибка получения ссылки для редиректа!');
          }
        });
    }
  };

  updateValidation = (id, val) => {
    this.vaidationInstance.updateValue(id, val);
  };

  // Railway Goals
  setTarget = () => {
    switch (this.pageType) {
      case 'home':
        window.goal('home_search_railway');
        break;
      case 'landing':
        window.goal('home_landiпg_search_railway');
        break;
      case 'seo':
        window.goal('city2city_railway_search_main');
        break;
      case 'routes':
        window.goal('routes_search_railway');
        break;
      case 'hint':
        window.goal('routes_searchclick_railway_top');
        break;
      default:
        break;
    }
  };

  // Local Storage methods
  insertDataToLocalStorage = () => {
    localStorage.setItem('railway-search-form-data', JSON.stringify(this.generateStorageData()));
  };

  generateStorageData = () => ({
    from: this.from,
    to: this.to,
    dateFrom: this.dateFrom,
    dateTo: this.dateTo,
  });
}

// Init railway form
$(() => {
  const $railway = document.querySelector('.js-railway-form');
  if ($railway) {
    $(() => new RailwayForm($railway));
  }
});
