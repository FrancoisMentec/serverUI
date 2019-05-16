class Dialog {
  constructor (title, content, actions, shortcuts) {
    this._visible = false

    this.wrap = document.createElement('div')
    this.wrap.classList.add('dialog-wrap')
    document.body.appendChild(this.wrap)

    this.dialog = document.createElement('div')
    this.dialog.classList.add('dialog')
    this.wrap.appendChild(this.dialog)

    if (title) {
      this.titleDiv = document.createElement('div')
      this.titleDiv.classList.add('title')
      this.titleDiv.innerHTML = title
      this.dialog.appendChild(this.titleDiv)
    }

    if (typeof content === 'string') {
      this.content = document.createElement('div')
      this.content.innerHTML = content
    } else {
      this.content = content
    }
    this.content.classList.add('content')
    this.dialog.appendChild(this.content)

    if (Object.keys(actions).length > 0) {
      this.actionsDiv = document.createElement('div')
      this.actionsDiv.classList.add('actions')
      this.dialog.appendChild(this.actionsDiv)
      for (let action in actions) {
        let button = document.createElement('button')
        button.classList.add('text')
        button.innerHTML = action
        button.addEventListener('click', e => {
          actions[action](this, e)
        })
        this.actionsDiv.appendChild(button)
      }
    }

    if (shortcuts) {
      document.addEventListener('keyup', e => {
        if (this.visible) {
          if (typeof shortcuts[e.key] != 'undefined') {
            e.stopPropagation()
            if (typeof shortcuts[e.key] == 'string') {
              actions[shortcuts[e.key]](this, e)
            } else {
              shortcuts[e.key](this, e)
            }
          }
        }
      })
    }
  }

  get visible () {
    return this._visible
  }

  set visible (val) {
    this._visible = val
    this.wrap.classList.toggle('visible', val)
  }

  show () {
    setTimeout(() => {
      this.visible = true
    }, 10)
  }

  hide () {
    this.visible = false
  }

  remove () {
    this.hide()
    setTimeout(() => {
      document.body.removeChild(this.wrap)
    }, 200)
  }
}

function showError (error) {
  console.error(error)
  let content = error
  if (typeof content === 'object') {
    if (typeof content.message !== 'undefined') {
      content = content.message
    } else if (typeof content.code !== 'undefined') {
      content = content.code
    }
  }
  let dialog = new Dialog('Error', content, {'OK': () => {dialog.remove()}}, {'Enter': 'OK', 'Escape': 'OK'})
  dialog.show()
}
