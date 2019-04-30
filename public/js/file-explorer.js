class FileExplorer extends HTMLElement {
  constructor (path='/') {
    super()

    this._path = null
    this.elements = []
    this.selectedElements = []
    this.clipboard = null
    this.clipboardState = null

    this.navBar = document.createElement('div')
    this.navBar.classList.add('nav-bar')
    this.appendChild(this.navBar)

    this.pathDiv = document.createElement('div')
    this.pathDiv.classList.add('path')
    this.navBar.appendChild(this.pathDiv)

    this.actionBar = document.createElement('div')
    this.actionBar.classList.add('action-bar')
    this.navBar.appendChild(this.actionBar)

    this.search = document.createElement('input')
    this.search.classList.add('search')
    this.search.setAttribute('placeholder', 'Search')
    this.actionBar.appendChild(this.search)
    this.search.addEventListener('keyup', e => {
      let query = this.search.value.toLowerCase()
      for (let i = 0; i < this.elements.length; i++) {
        this.elements[i].visible = this.elements[i].name.toLowerCase().includes(query)
      }
    })

    this.renameButton = document.createElement('button')
    this.renameButton.classList.add('text')
    this.renameButton.innerHTML = 'RENAME'
    this.renameButton.addEventListener('click', () => {
      this.rename()
    })
    this.actionBar.appendChild(this.renameButton)

    this.content = new ScrollArea()//document.createElement('scroll-area')
    this.content.classList.add('content')
    this.appendChild(this.content)

    window.addEventListener('keyup', e => {
      if (this.classList.contains('visible') && e.ctrlKey) {
        if (e.code === 'KeyC') {
          this.clipboard = this.selectedElements.map(f => f.path)
          this.clipboardState = 'copy'
        } else if (e.code === 'KeyX') {
          console.log('Cut not implemented')
        } else if (e.code === 'KeyV') {
          this.paste()
        }
      }
    })

    this.path = path
  }

  get path () {
    return this._path
  }

  set path (val) {
    val = val.replace(/\\/g, '/')
    this._path = val
    //this.content.innerHTML = 'Loading...'

    while (this.pathDiv.firstChild) {
      this.pathDiv.removeChild(this.pathDiv.firstChild)
    }

    let elt = document.createElement('div')
    elt.innerHTML = '/'
    elt.addEventListener('click', e => {
      this.path = '/'
    })
    this.pathDiv.appendChild(elt)
    let paths = val.split('/')
    for (let p = 0, lp = paths.length; p < lp; p++) {
      if (paths[p].length > 0) {
        elt = document.createElement('span')
        elt.innerHTML = 'keyboard_arrow_right'
        this.pathDiv.appendChild(elt)
        elt = document.createElement('div')
        elt.innerHTML = paths[p]
        elt.addEventListener('click', e => {
          this.path = '/' + paths.slice(0, p + 1).join('/')
        })
        this.pathDiv.appendChild(elt)
      }
    }

    fetch('/directory-content', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: val
      })
    }).then(res => {
      this.elements = []
      this.selectedElements = []
      this.content.clear()

      res.json().then(data => {
        if (data.error) {
          console.error(data.error)
        } else {
          //console.log(data)
          for (let f = 0, lf = data.files.length; f < lf; f++) {
            let elt = new ExplorerElement(data.files[f], this)
            this.elements.push(elt)
            this.content.appendChild(elt)
          }
        }
      })
    })
  }

  unselectAll () {
    while (this.selectedElements.length > 0) {
      this.selectedElements[0].selected = false
    }
  }

  paste () {
    if (this.clipboard == null || this.clipboard.length === 0) return

    fetch('/' + this.clipboardState + '-files', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        files: this.clipboard,
        destination: this.path
      })
    }).then(res => {
      this.refresh()
      res.json().then(data => {
        if (data.error) {
          console.log('Error')
          for (let f of data.filesError) {
            console.log(f.file)
            console.error(f.error)
          }
        } else {
          console.log(data)
        }
      })
    })
  }

  refresh () {
    this.path = this.path
  }

  rename () {
    let dialog = null
    if (this.selectedElements.length != 1) {
      dialog = new Dialog('Error', 'Rename need one, and only one, element to be selected.', {
        'OK': () => {
          dialog.remove()
        }
      })
    } else {
      let content = document.createElement('div')
      content.innerHTML = 'Enter a new name for <b>' + this.selectedElements[0].name + '</b>.<br>'
      let input = new TextField('Name')
      input.style.width = '100%';
      input.value = this.selectedElements[0].name
      content.appendChild(input)
      dialog = new Dialog('Rename', content, {
        'CANCEL': () => {
          dialog.remove()
        },
        'OK': () => {
          console.log('yolo')
        }
      })
      input.select()
    }
    dialog.show()
  }
}

customElements.define('file-explorer', FileExplorer)

class ExplorerElement extends HTMLElement {
  constructor (params, explorer) {
    super()

    this.explorer = explorer

    this._selected = false
    this.path = params.path
    this.name = params.name

    this.icon = document.createElement('div')
    this.icon.classList.add('icon')
    this.icon.classList.add(params.type)
    this.icon.innerHTML = params.type === 'directory'
      ? 'folder'
      : 'insert_drive_file'
    this.appendChild(this.icon)

    this.nameDiv = document.createElement('div')
    this.nameDiv.classList.add('name')
    this.nameDiv.innerHTML = params.name
    this.appendChild(this.nameDiv)

    if (params.type === 'directory') {
      this.addEventListener('dblclick', e => {
        this.explorer.path = params.path
      })
    }

    this.addEventListener('click', e => {
      if (e.ctrlKey) {
        this.selected = !this.selected
      } else {
        this.explorer.unselectAll()
        this.selected = true
      }
    })
  }

  get selected () {
    return this._selected
  }

  set selected (val) {
    this._selected = val
    this.classList.toggle('selected', val)
    if (val) {
      this.explorer.selectedElements.push(this)
    } else {
      let index = this.explorer.selectedElements.indexOf(this)
      if (index > -1) {
        this.explorer.selectedElements.splice(index, 1)
      }
    }
  }

  set visible (val) {
    this.classList.toggle('hidden', !val)
    if (!val) {
      this.selected = false
    }
  }
}

customElements.define('explorer-element', ExplorerElement)
