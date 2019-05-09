//****************************************************************************************************
// Button
class MButton extends HTMLElement {
  constructor (content, action, className, tooltip, enabled=true) {
    super()

    this.tooltipTimeout = null

    this._enabled = true
    this.enabled = enabled

    if (content) {
      this.innerHTML = content
    }

    if (className) {
      this.className = className
    }

    this.isToggle = this.classList.contains('toggle')
    this._toggled = false
    if (this.isToggle) {
      this.addEventListener('click', e => {
        if (this.enabled) this.toggled = !this.toggled
      })
    }

    if (action) {
      this.addEventListener('click', e => {
        if (this.enabled) action(e)
      })
    }

    this._tooltip = null
    this.tooltipDiv = document.createElement('div')
    this.tooltipDiv.classList.add('tooltip')
    this.appendChild(this.tooltipDiv)

    if (tooltip) {
      this.tooltip = tooltip
    } else if (this.hasAttribute('tooltip')) {
      this.tooltip = this.getAttribute('tooltip')
    }

    this.addEventListener('mouseenter', e => {
      if (this.tooltip) {
        this.tooltipTimeout = setTimeout(() => {
          this.tooltipDiv.classList.add('visible')
        }, 500)
      }
    })
    this.addEventListener('mouseout', e => {
      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout)
      }
      this.tooltipDiv.classList.remove('visible')
    })
  }

  get enabled () {
    return this._enabled
  }

  set enabled (val) {
    this._enabled = val
    this.classList.toggle('disabled', !val)
  }

  get tooltip () {
    return this._tooltip
  }

  set tooltip (val) {
    this._tooltip = val
    this.tooltipDiv.innerHTML = val
  }

  get toggled () {
    return this._toggled
  }

  set toggled (val) {
    this._toggled = val
    this.classList.toggle('toggled', val)
  }
}

customElements.define('m-button', MButton)

//****************************************************************************************************
//TextFields
class TextField extends HTMLElement {
  constructor (label, type='text') {
    super()

    this.onEnter = null

    this.input = document.createElement('input')
    if (this.hasAttribute('type')) {
      this.input.setAttribute('type', this.getAttribute('type'))
    } else {
      this.input.setAttribute('type', type)
    }
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

  select (a, b) {
    if (typeof a != 'undefined') {
      if (typeof b != 'undefined') {
        this.input.setSelectionRange(a, b)
      } else {
        this.input.setSelectionRange(0, a)
      }
    } else {
      this.input.select()
    }
    this.focus()
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

//****************************************************************************************************
// Radio Button
class RadioButton extends HTMLElement {
  constructor (label, value, name, checked) {
    super()

    this.input = document.createElement('input')
    this.input.setAttribute('type', 'radio')
    this.appendChild(this.input)
    if (name) {
      this.input.setAttribute('name', name)
    } else if (this.hasAttribute('name')) {
      this.input.setAttribute('name', this.getAttribute('name'))
    }

    this.labelDiv = document.createElement('label')
    this.appendChild(this.labelDiv)

    if (label) {
      this.labelDiv.innerHTML = label
    } else if (this.hasAttribute('label')) {
      this.labelDiv.innerHTML = this.getAttribute('label')
    }

    this.addEventListener('click', e => {
      e.stopPropagation()
      this.checked = true
    })

    this.checked = this.hasAttribute('checked') || checked
  }

  get checked () {
    return this.input.checked
  }

  set checked (val) {
    this.input.checked = val
  }
}

customElements.define('radio-button', RadioButton)
