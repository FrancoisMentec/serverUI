//****************************************************************************************************
//TextFields
class TextField extends HTMLElement {
  constructor () {
    super()

    this.onEnter = null

    this.input = document.createElement('input')
    this.input.setAttribute('type', this.getAttribute('type'))
    this.input.addEventListener('focus', e => {
      this.classList.add('focus')
    })
    this.input.addEventListener('focusout', e => {
      this.classList.remove('focus')
    })
    this.input.addEventListener('change', e => {
      this.updateNotEmpty()
    })
    this.input.addEventListener('keyup', e => {
      if (e.keyCode === 13 && this.onEnter != null) {
        this.onEnter()
      }
    })
    this.appendChild(this.input)

    this._label = document.createElement('label')
    this.appendChild(this._label)
    this.label = this.getAttribute('label')
  }

  set label (val) {
    this._label.innerHTML = val
      ? val
      : ''
    this._label.style.visible = val
      ? true
      : false
  }

  get value () {
    return this.input.value
  }

  set value (val) {
    this.input.value = val
    this.updateNotEmpty()
  }

  updateNotEmpty () {
    this.classList.toggle('not-empty', this.value.length > 0)
  }

  focus () {
    this.input.focus()
  }
}

customElements.define('text-field', TextField)

//****************************************************************************************************
//CheckBox
class Checkbox extends HTMLElement {
  constructor () {
    super()

    this.input = document.createElement('input')
    this.input.setAttribute('type', 'checkbox')
    this.input.addEventListener('keyup', e => {
      if (e.keyCode === 13 && this.onEnter != null) {
        this.onEnter()
      }
    })
    this.appendChild(this.input)

    this._label = document.createElement('label')
    this._label.addEventListener('click', e => {
      this.value = !this.value
    })
    this.appendChild(this._label)
    this.label = this.getAttribute('label')
  }

  set label (val) {
    this._label.innerHTML = val
      ? val
      : ''
    this._label.style.visible = val
      ? true
      : false
  }

  get value () {
    return this.input.checked
  }

  set value (val) {
    this.input.checked = val
  }
}

customElements.define('check-box', Checkbox)
