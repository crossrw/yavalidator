/**
 * @file YetAnotherValidator
 * @author Aleksey Lutovinin <crossrw1@gmail.com>
 * @version 1.0
 * @license MIT
 */

var yav_regex_number = /^-?\d+$/;
var yav_regex_float = /^-?[0-9]+([.][0-9]+)?$/;
var yav_regex_email = /^.+@[^\.].*\.[a-z]{2,}$/i;
var yav_regex_phone = /^(\+\d|\d)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/;
var yav_regex_url 	= /^(?:(?:http|https|ftp):\/\/)?(?:(?:[a-z][\w~%!&amp;',;=\-\.$\(\)\*\+]*):.*@)?(?:(?:[a-z0-9][\w\-]*[a-z0-9]*\.)*(?:(?:(?:(?:[a-z0-9][\w\-]*[a-z0-9]*)(?:\.[a-z0-9]+)?)|(?:(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)))(?::[0-9]+)?))?(?:(?:(?:\/(?:[\w`~!$=;\-\+\.\^\(\)\|\{\}\[\]]|(?:%\d\d))+)*\/(?:[\w`~!$=;\-\+\.\^\(\)\|\{\}\[\]]|(?:%\d\d))*)(?:\?[^#]+)?(?:#[a-z0-9]\w*)?)?$/i;
// RFC 952
var yav_regex_hostname = /^[a-zA-Z]([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9])(\.([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]{0,61}[a-zA-Z0-9]))*$/;
var yav_regex_ip 	= /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
// Банковские реквизиты:
var yav_regex_kpp	= /^[0-9]{4}[0-9A-Z]{2}[0-9]{3}$/;
var yav_regex_inn	= /^((?:\d{10})|(?:\d{12}))$/;
var yav_regex_acc	= /^\d{20}$/;
var yav_regex_snils	= /^\d{11}$/;
var yav_regex_bik	= /^\d{9}$/;


/**
 * Обработчик изменения значения элемента в группе.
 * @callback changeDataCallback
 * @param {boolean} changed Значения элементов группы изменились по сравнению с ранее зафиксированным значением
 * @param {boolean} valid Значения элементов группы корректны
 * @param {Object} data Текущие значения элементов группы
 */

/**
 * Параметры валидации.
 * @typedef {Object} yavOptions
 * @property {boolean} [disabled=false] - Проверять элементы с атрибутом "disabled"
 * @property {boolean} [readonly=false] - Проверять элементы с атрибутом "readonly"
 * @property {boolean} [hidden=false]   - Проверять невидимые (display=none) элементы
 * @property {boolean} [onedit=false]   - Проверять в ходе редактирования
 */

/**
 * Инициализация валидатора.
 * @class
 * @classdesc Класс валидации значений HTML элементов
 * @param {string} selector Имя класса для выбора проверяемых элементов
 * @param {string} [invalidClassName] Имя класса для маркировки элементов с некорректными значениемя
 * @param {yavOptions} [options] Набор параметров
 * @param {changeDataCallback} [changeDataCB] Обработчик изменения значения элемента в группе
 */
class YAValidator {
	constructor(selector, invalidClassName, options, changeDataCB) {
		/** @private {string} */
		this.invalidClassName = invalidClassName;
		/** @private {yavOptions} */
		this.options = Object.assign({}, {
			"disabled": false,
			"readonly": false,
			"hidden": false,
			"onedit": false
		}, options);
		//
		/** @private {changeDataCallback} */
		this.changeDataCB = changeDataCB || null;
		//
		/** @private {Object} */
		this.fixedData = null;
		//
		var that = this;
		//
		/** @private {HTMLCollectionOf} */
		this.elementsList = document.getElementsByClassName(selector);
		//
		// установка обработчиков в случае валидации 'onedit' или использовании 'changeDataCB'
		if ((this.options.onedit && invalidClassName) || this.changeDataCB) {
			for (var i = 0; i < this.elementsList.length; i++) {
				var elem = this.elementsList[i];
				elem.addEventListener('change', function(event) {
					that._changeHandler(that, event);
				}, false);
				elem.addEventListener('input', function(event) {
					that._changeHandler(that, event);
				}, false);
			}
		}
		//
		/** @private {Object} */
		this.validate_classes = {
			'yav-hostname':	yav_regex_hostname,
			'yav-integer':	yav_regex_number,
			'yav-number':	yav_regex_float,
			'yav-float':	yav_regex_float,
			'yav-email':	yav_regex_email,
			'yav-phone':	yav_regex_phone,
			'yav-url':		yav_regex_url,
			'yav-ip':		yav_regex_ip,
			'yav-inn':		yav_regex_inn,
			'yav-kpp':		yav_regex_kpp,
			'yav-bik':		yav_regex_bik,
			'yav-acc':		yav_regex_acc,
			'yav-snils':	yav_regex_snils
		};
	}
	/**
	 * Сравнение текущих значений элементов с зафиксированными
	 * @private
	 * @param {Object} currentData Текущие значения
	 * @param {Object} fixedData Зафиксированные значения
	 * @returns {boolean} true - данные изменились
	 */
	_compareData(currentData, fixedData) {
		if(!fixedData)
			return true;
		//
		for (var elem in currentData) {
			if (elem in fixedData) {
				if (currentData[elem] != fixedData[elem])
					return true;
			}
		}
		return false;
	}
	/**
	 * Обработчик изменения значения элемента
	 * @private
	 * @param {YAValidator} that
	 * @param {UIEvent} event
	 */
	_changeHandler(that, event) {
		// проверка необходимости валидации
		if (that.invalidClassName) {
			// валидация элемента
			var elem = event.target;
			if (that._validateElement(elem)) {
				elem.classList.remove(that.invalidClassName);
			} else {
				elem.classList.add(that.invalidClassName);
			}
		}
		// проверка необходимости вызова "changeDataCB"
		if (that.changeDataCB) {
			var valid = that.validate();
			// сравнение зафиксированных данных с текущими значениями
			var currentData = that.getData();
			var changed = that._compareData(currentData, that.fixedData);
			//
			that.changeDataCB(changed, valid, currentData);
		}
	}
	/**
	 * Валидация значений всех элементов группы.
	 * Если валидация значения хотя-бы одного одного элемента не прошла, то возвращает false.
	 * Для элементов не прошедших валидацию назначается класс "invalidClassName".
	 * @returns {boolean} Результат валидации
	 */
	validate() {
		var result = true;
		// remove invalidClassName
		if (this.invalidClassName)
			this.invalidate();
		//
		/** @private HTMLInputElement */
		var elem;
		for (var i = 0; i < this.elementsList.length; i++) {
			elem = this.elementsList[i];
			//
			if ((!this.options.disabled) && elem.getAttribute('disabled'))
				continue;
			if ((!this.options.readonly) && elem.getAttribute('readonly'))
				continue;
			if (!this.options.hidden) {
				/** @type {CSSStyleDeclaration} */
				var css = window.getComputedStyle(elem);
				if (css.display == 'none')
					continue;
			}
			//
			if (!this._validateElement(elem)) {
				if (this.invalidClassName)
					elem.classList.add(this.invalidClassName);
				result = false;
			}
		}
		return result;
	}
	/**
	 * Валидация одного элемента
	 * @private
	 * @param {HTMLInputElement} element
	 * @returns {boolean} Validation result
	 */
	_validateElement(element) {
		// проверка только элементов INPUT
		if (element.tagName != 'INPUT')
			return true;
		//
		if (element.type == 'number') {
			// проверка встроенными средствами
			if (element.validity && !element.validity.valid)
				return false;
		}
		//
		var value = element.value;
		// check empty value
		if (element.hasAttribute('required')) {
			// пустые значения запрещены
			if (!value)
				return false;
		} else {
			// пустые значения разрешены
			if (!value)
				return true;
		}
		//
		switch (element.type) {
			case 'text':
				var pattern = element.getAttribute('pattern');
				if (pattern) {
					// проверка по шаблону
					var regex = new RegExp(pattern);
					return regex.test(value);
				}
				// проверка наличия классов валидации
				var res = true;
				for (var className in this.validate_classes) {
					if (element.classList.contains(className)) {
						// проверка регулярным выражением
						if (this.validate_classes[className].test(value)) {
							// дополнительная проверка
							switch(className) {
								case 'yav-inn':
									if(this._checkInn(value)) 
										return true;
									break;
								case 'yav-snils':
									if(this._checkSnils(value))
										return true;
									break;
								default:
									return true;
							}
						}
						res = false;
					}
				}
				return res;
			case 'url':
				return yav_regex_url.test(value);
			case 'tel':
				return yav_regex_phone.test(value);
			case 'email':
				return yav_regex_email.test(value);
			case 'number':
				if (!yav_regex_float.test(value))
					return false;
				value = parseFloat(value);
				if (element.hasAttribute('min')) {
					if (value < element.getAttribute('min'))
						return false;
				}
				if (element.hasAttribute('max')) {
					if (value > element.getAttribute('max'))
						return false;
				}
				return true;
			default:
				return true;
		}
	}
	/**
	 * Удалить класс "invalidClassName" у всех элементов
	 */
	invalidate() {
		if (!this.invalidClassName)
			return;
		//
		var elem;
		for (var i = 0; i < this.elementsList.length; i++) {
			elem = this.elementsList[i];
			elem.classList.remove(this.invalidClassName);
		}
	}
	/**
	 * Устанавливает значения элементам входящим в группу.
	 * Объект "data" должен содержать записи соотвтетствующие значениям атрибутов "id" элементов группы. Для элементов "input[type=radio]"
	 * вместо "id" используется значение атрибута "name". Значение параметра "id_prefix" аналогично использованию в методе "getData()".
	 * @param {Object} data Объект со значениями элементов группы
	 * @param {string} [id_prefix] Добавляемый префикс для ключей объекта со значениями
	 * @param {boolean} [nofix] Не фиксировать изменения
	 */
	setData(data, id_prefix, nofix) {
		if(!data) return;
		/** @private HTMLInputElement */
		var elem;
		for (var i = 0; i < this.elementsList.length; i++) {
			elem = this.elementsList[i];
			//
			if ((elem.tagName == 'INPUT') && (elem.type == 'radio')) {
				// input[type=radio]
				var radioName = elem.name;
				if (!radioName)
					continue;
				//
				var radios = document.getElementsByName(radioName);
				if (!radios.length)
					continue;
				//
				if (id_prefix) {
					if (radioName.indexOf(id_prefix) === 0)
						radioName = radioName.substring(id_prefix.length);
				}
				//
				if (!(radioName in data))
					continue;
				//
				for (var j = 0; j < radios.length; j++) {
					if (radios[j].value == data[radioName]) {
						radios[j].checked = true;
						break;
					}
				}
			} else {
				// другие элементы
				var elemId = elem.id;
				if (!elemId)
					continue;
				//
				if (id_prefix) {
					if (elemId.indexOf(id_prefix) === 0)
						elemId = elemId.substring(id_prefix.length);
				}
				//
				if (elemId in data) {
					if ((elem.tagName == 'INPUT') && (elem.type == 'checkbox')) {
						elem.checked = !!data[elemId];
					} else {
						elem.value = data[elemId];
					}
				}
			}
		}
		//
		if(nofix) {
			// фиксация не требуется, только проверка и вызов changeDataCB
			var valid = this.validate();
			if (this.changeDataCB)
				this.changeDataCB(false, valid, this.fixedData);
		} else {
			// фиксируем данные
			this.fixData();
		}
	}
	/**
	 * Возвращает объект со значениями всех элементов входящим в группу.
	 * В качестве ключей возвращаемого объекта используются значения атрибутов "id" элементов за исключением элементов "input[type=radio]".
	 * Для них вместо "id" используется значение атрибута "name". Если ключ начинается с префикса "id_prefix", то он будет удалён.
	 * @param {string} [id_prefix] Удаляемый префикс для ключей объекта со значениями
	 * @returns {Object} Значения всех элементов
	 */
	getData(id_prefix) {
		var values = {};
		//
		/** @private HTMLInputElement */
		var elem;
		for (var i = 0; i < this.elementsList.length; i++) {
			elem = this.elementsList[i];
			//
			if ((!this.options.disabled) && elem.getAttribute('disabled'))
				continue;
			if ((!this.options.readonly) && elem.getAttribute('readonly'))
				continue;
			if (!this.options.hidden) {
				/** @type {CSSStyleDeclaration} */
				var css = window.getComputedStyle(elem);
				if (css.display == 'none')
					continue;
			}
			//
			if ((elem.tagName == 'INPUT') && (elem.type == 'radio')) {
				var radioName = elem.name;
				if (!radioName)
					continue;
				//
				var radioVal = document.querySelector('input[name="' + radioName + '"]:checked').value;
				if (id_prefix) {
					// удаление префикса, если он есть
					if (radioName.indexOf(id_prefix) === 0)
						radioName = radioName.substring(id_prefix.length);
				}
				// значение уже было присвоено
				if (radioName in values)
					continue;
				values[radioName] = radioVal;
			} else {
				var elemId = elem.id;
				if (!elemId)
					continue;
				//
				if (id_prefix) {
					// удаление префикса, если он есть
					if (elemId.indexOf(id_prefix) === 0)
						elemId = elemId.substring(id_prefix.length);
				}
				values[elemId] = this._getValue(elem);
			}
		}
		return values;
	}
	/**
	 * Фиксация текущих значений элементов.
	 * Зафиксированное значение используется для сравнения с текущими значениями элементов при формировании параметра "changed" обработчика изменений "changeDataCB".
	 * Если установлен параметр "onedit", то дополнительно выполняется валидация всех элементов.
	 */
	fixData() {
		// фиксируем текущие значения группы
		this.fixedData = this.getData();
		//
		if (this.options.onedit) {
			// начальная валиадация всех значений
			var valid = this.validate();
			// начальный вызов обработчика изменения данных
			if (this.changeDataCB)
				this.changeDataCB(false, valid, this.fixedData);
		}
	}
	/**
	 * Метод восстанавливает предварительно зафиксированные значение элементов.
	 * Если данные не были зафиксированы, то метод ничего не делает.
	 */
	restoreData() {
		if(!this.fixedData) return;
		//
		this.setData(this.fixedData, '', true);
	}
	/**
	 * @private
	 * @param {HTMLElement} element
	 */
	_getValue(element) {
		switch (element.tagName) {
			case 'INPUT':
				switch (element.type) {
					case 'number':
					case 'range':
						return parseFloat(element.value);
					case 'checkbox':
						return element.checked;
					default:
						return element.value;
				}
			default:
				return element.value;
		}
	}
	/**
	 * Проверка ИНН юрлиц, физлиц и ИП
	 * @private
	 * @param {string} value - строка для проверки
	 * @return boolean
	 */
	_checkInn(value) {
		if(value.length === 10) {
			return Number(value[9]) === (value.split('').slice(0, -1).reduce(
				(summ, symbol, index) => [2, 4, 10, 3, 5, 9, 4, 6, 8][index] * Number(symbol) + summ, 0) % 11) % 10;
		} else {
			var checkSumOne = (value.split('').slice(0, -2).reduce(
				(summ, symbol, index) => [7, 2, 4, 10, 3, 5, 9, 4, 6, 8][index] * Number(symbol) + summ, 0) % 11 ) % 10;
			var checkSumTwo = (value.split('').slice(0, -1).reduce(
				(summ, symbol, index) => [3, 7, 2, 4, 10, 3, 5, 9, 4, 6, 8][index] * Number(symbol) + summ, 0) % 11 ) % 10;
			return (checkSumOne === Number(value[10]) && checkSumTwo === Number(value[11]));
		}
	}
	/**
	 * Прверка значения СНИЛС
	 * @private
	 * @param {string} value - строка для проверки
	 */
	_checkSnils(value) {
		var sum = 0;
		for (var i = 0; i < 9; i++) {
			sum += parseInt(value[i], 10) * (9 - i);
		}
		if (sum >= 100) {
			if (sum > 101) {
				sum = sum % 101;
				if (sum === 100) sum = 0;
			}
		}
		return (sum === parseInt(value.slice(-2), 10));
	}
}
