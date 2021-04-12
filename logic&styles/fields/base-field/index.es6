import throttle from 'lodash-es/throttle';
import './base-field.sass';

export default class BaseField {
  constructor(elem, options) {
    this.$elem = null;
    this.baseElemCheck(elem);
    this.$input = this.$elem.querySelector('.js-input');
    this.$label = this.$elem.querySelector('.js-label');
    this.$fields = document.querySelectorAll('.new-search-forms__field');

    // Default options
    this.options = options || {};
    this.theme = options.theme || null;
    this.name = options.name || null;
    this.placeholder = options.placeholder || null;
    this.readonly = options.readonly || false;
    this.isToggleFocus = options.isToggleFocus || false;
    this.disableSelect = options.disableSelect || false;

    // Callbacks
    this.onBlurCallback = options.onBlurCallback || null;
    this.onFocusCallback = options.onFocusCallback || null;
    this.onInputCallback = options.onInputCallback || null;
    this.onClickCallback = options.onClickCallback || null;

    // classes
    this.focusedClass = 'focused';
    this.noSelectClass = 'js-noselect';
    this.visibleClass = 'visible';
    this.yellowClass = 'new-search-forms__field--yellow';
    this.jsControlClass = 'js-control';
    this.incorrectClass = 'incorrect';
    this.changerClass = 'js-changer';
    this.autocompleteMobileClass = 'js-mobile-open';

    // Variables
    this.isFirstCheck = true;
    this.blur = 'blur';
    this.focus = 'focus';
    this.click = 'click';
    this.input = 'input';

    // Initialization
    this.init();
  }

  init = () => {
    this.setupBaseField();
    this.resizeWindow();
    this.handleClick();
    this.handleBlur();
    this.handleFocus();
    this.handleInput();
  };

  baseElemCheck = elem => {
    if (elem instanceof HTMLElement) {
      this.$elem = elem;
    } else if (typeof elem === 'string') {
      this.$elem = document.querySelector(elem);
    } else {
      throw new Error('Задан некорректный класс или DOM элемент!');
    }
  };

  setupBaseField = () => {
    const mobile = window.innerWidth <= 640;

    if (this.placeholder) {
      if (mobile) {
        this.$input.setAttribute('placeholder', this.placeholder.mobile);
      } else {
        this.$input.setAttribute('placeholder', this.placeholder.desktop);
      }
    }

    if (this.readonly) {
      this.$input.setAttribute('readonly', 'readonly');
    }

    if (this.disableSelect) {
      this.$input.classList.add(this.noSelectClass);
    }

    this.switchYellowLabel();
  };

  resizeWindow = () => {
    window.addEventListener(
      'resize',
      throttle(() => {
        this.setupBaseField();
        this.handleClick();
        this.handleFocus();
        this.switchYellowLabel();
      }, 200).bind(this),
    );
  };

  // Callbacks
  handleBlur = () => {
    this.$elem.addEventListener(
      'blur',
      e => {
        if (this.onBlurCallback) {
          this.onBlurCallback();
        }

        const { target } = e;

        if (!target) this.$elem.classList.remove(this.focusedClass);
        this.switchYellowLabel(this.blur);
      },
      true,
    );
  };

  handleFocus = () => {
    this.$elem.addEventListener(
      'focus',
      e => {
        const { target, currentTarget } = e;

        if (this.onFocusCallback) {
          this.onFocusCallback();
        }

        if (target && !target.classList.contains(this.changerClass)) {
          if (window.innerWidth >= 768) this.addTargetFocus(currentTarget);
        }

        if (target && this.$input) {
          if (!this.disableSelect && window.innerWidth >= 768) this.$input.select();
        }

        // Only for yellow class
        this.switchYellowLabel(this.focus);
      },
      true,
    );
  };

  handleInput = () => {
    this.$input.addEventListener('input', e => {
      if (this.onInputCallback) {
        this.onInputCallback(e);
      }
    });
  };

  handleClick = () => {
    this.$elem.addEventListener('click', e => {
      const { target, currentTarget } = e;

      if (this.onClickCallback) {
        this.onClickCallback();
      }

      if (window.innerWidth <= 768) {
        if (
          this.$input &&
          !target.classList.contains(this.changerClass) &&
          currentTarget.classList.contains(this.autocompleteMobileClass)
        ) {
          const { value } = this.$input;
          this.$input.value = '';
          this.$input.value = value;
          this.$input.focus();
        }
      }

      if (target && !target.classList.contains(this.changerClass)) {
        if (window.innerWidth >= 768) {
          if (!this.isToggleFocus) this.addTargetFocus(currentTarget);
          if (!this.disableSelect) this.$input.select();
        }
      }

      this.switchYellowLabel(this.click);
    });
  };

  addTargetFocus = target => {
    this.$fields.forEach($el => $el.classList.remove(this.focusedClass));
    this.$fields.forEach($elem => {
      if ($elem === target) $elem.classList.add(this.focusedClass);
    });
  };

  switchYellowLabel = type => {
    if (this.$elem.classList.contains(this.yellowClass)) {
      if (window.innerWidth >= 768) {
        if (this.$input.value.trim()) {
          this.$label.classList.add(this.visibleClass);
        }

        if (type === this.click || type === this.focus || type === this.input) {
          this.$label.classList.add(this.visibleClass);
        } else if (type === this.blur) {
          if (!this.$input.value.trim()) {
            this.$label.classList.remove(this.visibleClass);
          }
        }
      }
    }
  };

  setIncorrectField = () => {
    this.$elem.classList.add(this.incorrectClass);
  };

  setCorrectField = () => {
    this.$elem.classList.remove(this.incorrectClass);
  };

  fieldValue() {
    return this.$input.value;
  }

  setValue = string => {
    this.$input.value = string;
  };
}
