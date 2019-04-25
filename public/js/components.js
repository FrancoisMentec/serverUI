class TextField extends HTMLElement {
  constructor() {
    super()

    this.onEnter = null

    this._label = document.createElement('label')
    this.appendChild(this._label)
    //this.label = this.getAttribute('label')
    this.label = this.getAttribute('label')

    this.input = document.createElement('input')
    this.input.setAttribute('type', this.getAttribute('type'))
    this.input.addEventListener('focus', e => {
      this.classList.add('focus')
    })
    this.input.addEventListener('focusout', e => {
      this.classList.remove('focus')
    })
    this.input.addEventListener('change', e => {
      this.classList.toggle('not-empty', this.value.length > 0)
    })
    this.input.addEventListener('keyup', e => {
      if (e.keyCode === 13 && this.onEnter != null) {
        this.onEnter()
      }
    })
    this.appendChild(this.input)
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

  focus () {
    this.input.focus()
  }
}

customElements.define('text-field', TextField)
