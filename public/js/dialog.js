class Dialog {
  constructor (title, content, actions) {
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
  }

  set visible (val) {
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
