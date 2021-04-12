import './counter.sass';

export default class Counter {
  constructor($elem, options) {
    this.$elem = $elem;
    this.$increment = $elem.querySelector('.js-increment');
    this.$decrement = $elem.querySelector('.js-decrement');
    this.$result = $elem.querySelector('.js-result');

    this.count = options.count || 0;
    this.minLimit = options.minLimit || 0;
    this.maxLimit = options.maxLimit || 9;
    this.onPick = options.onPick || null;

    this.incrementClass = 'js-increment';
    this.decrementClass = 'js-decrement';
    this.inactiveClass = 'inactive';

    this.init();
  }

  init = () => {
    this.initClickHandlers();
    this.updateResultField();
  };

  updateResultField = () => {
    this.$result.value = this.count;
    this.checkToAddClass([this.incrementClass, this.decrementClass]);
  };

  initClickHandlers = () => {
    this.$elem.addEventListener('click', e => {
      const { target } = e;
      e.preventDefault();

      if (target && target.classList.contains(this.incrementClass) && this.count <= this.maxLimit - 1) {
        this.count += 1;
        this.updateResultField();
        this.checkToAddClass(this.incrementClass);
        this.onPick(this.count);
      } else if (target && target.classList.contains(this.decrementClass) && this.count > this.minLimit) {
        this.count -= 1;
        this.updateResultField();
        this.checkToAddClass(this.decrementClass);
        this.onPick(this.count);
      }
    });
  };

  checkToAddClass = type => {
    if (typeof type === 'string') {
      this.checkMinMax(type);
    } else if (Array.isArray(type)) {
      type.forEach(elem => this.checkMinMax(elem));
    }
  };

  checkMinMax = className => {
    if (className === this.incrementClass) {
      if (this.count === this.maxLimit) {
        this.$increment.classList.add(this.inactiveClass);
      } else {
        this.$increment.classList.remove(this.inactiveClass);
      }
    } else if (className === this.decrementClass) {
      if (this.count === this.minLimit) {
        this.$decrement.classList.add(this.inactiveClass);
      } else {
        this.$decrement.classList.remove(this.inactiveClass);
      }
    }
  };

  disableButtons = () => {
    this.$increment.classList.add(this.inactiveClass);
  };

  enableButtons = () => {
    this.$increment.classList.remove(this.inactiveClass);
  };

  setCount(num) {
    if (typeof num === 'number' && num >= 0) {
      this.$result.value = num;
      this.count = num;
      this.updateResultField();
    } else {
      throw new Error(`Значение сеттера должно быть числом, равным или больше 0! Ваше значение ${num}`);
    }
  }

  get returnCount() {
    return this.count;
  }
}
