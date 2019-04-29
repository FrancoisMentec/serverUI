class FileExplorer extends HTMLElement {
  constructor () {
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

    this.content = new ScrollArea()//document.createElement('scroll-area')
    this.content.classList.add('content')
    this.appendChild(this.content)

    this.path = '/'

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
      this.selectedElements.pop().selected = false
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
}

customElements.define('file-explorer', FileExplorer)

class ExplorerElement extends HTMLElement {
  constructor (params, explorer) {
    super()

    this.explorer = explorer

    this._selected = false
    this.path = params.path

    this.icon = document.createElement('div')
    this.icon.classList.add('icon')
    this.icon.innerHTML = params.type === 'directory'
      ? 'folder'
      : 'insert_drive_file'
    this.appendChild(this.icon)

    this.name = document.createElement('div')
    this.name.classList.add('name')
    this.name.innerHTML = params.name
    this.appendChild(this.name)

    if (params.type === 'directory') {
      this.addEventListener('dblclick', e => {
        this.explorer.path = params.path
      })
    }

    this.addEventListener('click', e => {
      this.explorer.unselectAll()
      this.selected = true
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
    }
  }
}

customElements.define('explorer-element', ExplorerElement)
