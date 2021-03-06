class FileExplorer extends HTMLElement {
  constructor () {
    super()

    this._path = null
    this.elements = []
    this.selectedElements = []
    this.clipboard = []
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

    this.pasteButton = new MButton('content_paste', () => {
      this.paste()
    }, 'text icon', 'Paste', false)
    this.actionBar.appendChild(this.pasteButton)

    this.copyButton = new MButton('content_copy', () => {
      this.copy()
    }, 'text icon', 'Copy', false)
    this.actionBar.appendChild(this.copyButton)

    this.removeButton = new MButton('delete', () => {
      this.remove()
    }, 'text icon', 'Remove', false)
    this.actionBar.appendChild(this.removeButton)

    this.renameButton = new MButton('edit', () => {
      this.rename()
    }, 'text icon', 'Rename', false)
    this.actionBar.appendChild(this.renameButton)

    this.downloadButton = new MButton('get_app', () => {
      this.download()
    }, 'text icon', 'Download/Share', false)
    this.actionBar.appendChild(this.downloadButton)

    this.newFileButton = new MButton('add_box', () => {
      this.newFile()
    }, 'text icon', 'New file')
    this.actionBar.appendChild(this.newFileButton)

    this.content = new ScrollArea()
    this.content.classList.add('content')
    this.appendChild(this.content)

    window.addEventListener('keyup', e => {
      if (!this.classList.contains('hidden')) {
        if (e.ctrlKey) {
          if (e.key === 'c') {
            this.copy()
          } else if (e.key === 'x') {
            console.log('Cut not implemented')
          } else if (e.key === 'v') {
            this.paste()
          }
        } else if (e.key === 'Delete') {
          this.remove()
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
    this.selectedElements = []
    this.checkActionsAvaible()

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

  checkActionsAvaible () {
    this.renameButton.enabled = this.selectedElements.length == 1
    this.copyButton.enabled = this.selectedElements.length > 0
    this.removeButton.enabled = this.selectedElements.length > 0
    this.pasteButton.enabled = this.clipboard.length > 0
    this.downloadButton.enabled = this.selectedElements.length == 1 && this.selectedElements[0].type == 'file'
  }

  unselectAll () {
    while (this.selectedElements.length > 0) {
      this.selectedElements[0].selected = false
    }
  }

  copy () {
    this.clipboard = this.selectedElements.map(f => f.path)
    this.clipboardState = 'copy'
    this.checkActionsAvaible()
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
          let content = 'Failed to paste :<ul>'
          for (let f of data.filesError) {
            console.error(f.error)
            content += '<li>' + f.file + ' (' + (f.error.message || f.error.code) + ')</li>'
          }
          content += '</ul>'
          let dialog = new Dialog('Error', content, {'OK': () => {dialog.remove()}})
          dialog.show()
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
        'RENAME': () => {
          fetch('/rename-file', {
            method: 'POST',
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              path: this.selectedElements[0].path,
              name: input.value
            })
          }).then(res => {
            this.refresh()
            res.json().then(data => {
              if (data.error) {
                console.error(data.error)
                input.error = data.error.message
              } else {
                dialog.remove()
              }
            })
          })
        }
      }, {
        'Escape': 'CANCEL',
        'Enter': 'RENAME'
      })
      input.select(input.value.lastIndexOf('.'))
    }
    dialog.show()
  }

  remove () {
    if (this.selectedElements.length < 1) return
    let dialog = new Dialog('Remove', 'Are you sure you want to remove :<ul><li>' + this.selectedElements.map(e => e.name).join('</li><li>') + '</li></ul>', {
      'CANCEL': () => {
        dialog.remove()
      },
      'REMOVE': () => {
        dialog.remove()
        fetch('/remove-files', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            files: this.selectedElements.map(e => e.path)
          })
        }).then(res => {
          this.refresh()
          res.json().then(data => {
            if (data.error) {
              let content = 'Failed to paste :<ul>'
              for (let f of data.filesError) {
                console.error(f.error)
                content += '<li>' + f.file + ' (' + (f.error.message || f.error.code) + ')</li>'
              }
              content += '</ul>'
              let dialog = new Dialog('Error', content, {'OK': () => {dialog.remove()}})
              dialog.show()
            }
          })
        })
      }
    }, {
      'Escape': 'CANCEL',
      'Enter': 'REMOVE'
    })
    dialog.show()
  }

  newFile () {
    let content = document.createElement('div')
    let name = new TextField('Name')
    name.style.width = '100%'
    content.appendChild(name)
    let file = new RadioButton('File', null, 'type', true)
    content.appendChild(file)
    let directory = new RadioButton('Directory', null, 'type')
    content.appendChild(directory)
    let dialog = new Dialog('New file', content, {
      'CANCEL': () => {dialog.remove()},
      'CREATE': () => {
        dialog.remove()
        fetch('/create-file', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            name: name.value,
            path: this.path,
            type: file.checked ? 'file' : 'directory'
          })
        }).then(res => {
          this.refresh()
          res.json().then(data => {
            if (data.error) {
              console.error(data.error)
              let dialog = new Dialog('Error', data.error.message || data.error.code, {'OK': () => {dialog.remove()}})
              dialog.show()
            }
          })
        })
      }
    }, {
      'Escape': 'CANCEL',
      'Enter': 'CREATE'
    })
    dialog.show()
    name.focus()
  }

  download () {
    let file = this.selectedElements[0]
    let content = document.createElement('div')
    content.innerHTML = 'Time before expiration :<br>'
    let days = new TextField('Days')
    days.value = 0
    days.style.width = '100px'
    content.appendChild(days)
    let hours = new TextField('Hours')
    hours.value = 3
    hours.style.width = '100px'
    hours.style.margin = '0 0 0 8px'
    content.appendChild(hours)
    let minutes = new TextField('Minutes')
    minutes.value = 0
    minutes.style.width = '100px'
    minutes.style.margin = '0 0 0 8px'
    content.appendChild(minutes)
    let link = document.createElement('div')
    content.appendChild(link)
    let dialog = new Dialog('Download/Share link generation', content, {
      'CLOSE': () => {dialog.remove()},
      'GENERATE': () => {
        //dialog.remove()
        fetch('/generate-link', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            path: file.path,
            days: days.value,
            hours: hours.value,
            minutes: minutes.value
          })
        }).then(res => {
          this.refresh()
          res.json().then(data => {
            if (data.error) showError(data.error)
            else {
              link.innerHTML += `<a href="/download/${data.key}/${file.name}" download="${file.name}">${window.location.origin}/download/${data.key}/${file.name}</a><br>`
            }
          })
        })
      }
    }, {
      'Escape': 'CLOSE',
      'Enter': 'GENERATE'
    })
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
    this.type = params.type

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
    this.explorer.checkActionsAvaible()
  }

  set visible (val) {
    this.classList.toggle('hidden', !val)
    if (!val) {
      this.selected = false
    }
  }
}

customElements.define('explorer-element', ExplorerElement)
