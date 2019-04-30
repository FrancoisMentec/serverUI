//****************************************************************************************************
//TextFields
class TextField extends HTMLElement {
  constructor (label) {
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
    if (label) {
      this.label = label
    } else if (this.hasAttribute('label')) {
      this.label = this.getAttribute('label')
    }


    this._message = document.createElement('p')
    this.appendChild(this._message)
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

  set error (val) {
    this._message.innerHTML = val
  }

  updateNotEmpty () {
    this.classList.toggle('not-empty', this.value.length > 0)
  }

  focus () {
    this.input.focus()
  }

  select () {
    this.input.select()
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

//****************************************************************************************************
//ScrollArea
class ScrollArea extends HTMLElement {
  constructor () {
    super()

    this.content = document.createElement('div')
    this.content.classList.add('content')
    this.appendChild(this.content, false)

    this.content.addEventListener('scroll', e => {
      this.classList.toggle('scrolled', this.content.scrollTop > 0)
    })
  }

  appendChild (element, content=true) {
    if (content) {
      this.content.appendChild(element)
    } else {
      super.appendChild(element)
    }
  }

  clear () {
    while (this.content.firstChild) {
      this.content.removeChild(this.content.firstChild)
    }
  }
}

customElements.define('scroll-area', ScrollArea)
