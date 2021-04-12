export default class FormValidation {
  constructor(form, fields) {
    this.$form = form;
    this.fields = fields;
    this.isValidForm = false;

    // Classes
    this.yellowForm = 'new-search-forms--yellow';

    // Init form
    this.init();
  }

  init = () => {
    if (this.$form) {
      this.validateOnSubmit();
    }
  };

  validateOnSubmit = () => {
    this.$form.addEventListener('submit', e => {
      e.preventDefault();

      const results = [];

      this.fields.forEach(field => {
        this.validateField(field);
        results.push(field.isValid);
      });

      if (!(results.indexOf(false) > -1)) this.isValidForm = true;

      this.validateOnEntry();
    });
  };

  validateOnEntry = () => {
    this.fields.forEach(field => {
      const { $input, $elem } = field.instance;

      $input.addEventListener('blur', () => {
        setTimeout(() => {
          this.validateField(field);
        }, 150);
      });

      $elem.addEventListener(
        'focus',
        () => {
          field.instance.setCorrectField();
        },
        true,
      );
    });
  };

  validateField = field => {
    const { instance, value } = field;

    if (instance.$input.value.trim() === '' || !value) {
      if (this.$form.classList.contains(this.yellowForm)) {
        instance.setIncorrectField();
        instance.switchYellowLabel('click');
      } else {
        instance.setIncorrectField();
      }

      // eslint-disable-next-line no-param-reassign
      field.isValid = false;
    } else {
      instance.setCorrectField();
      // eslint-disable-next-line no-param-reassign
      field.isValid = true;
    }
  };

  updateValue = (id, val) => {
    this.fields.forEach(field => {
      // eslint-disable-next-line no-param-reassign
      if (field.id === id) field.value = val;
    });
  };
}
