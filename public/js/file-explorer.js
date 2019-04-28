class FileExplorer extends HTMLElement {
  constructor () {
    super()

    this._path = null

    this.navBar = document.createElement('div')
    this.navBar.classList.add('nav-bar')
    this.appendChild(this.navBar)

    this.content = document.createElement('div')
    this.content.classList.add('content')
    this.appendChild(this.content)

    this.path = '/'
  }

  set path (val) {
    this._path = val

    fetch('/directory-content', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        path: val
      })
    }).then(res => {
      res.json().then(data => {
        if (data.error) {
          console.error(data.error)
        } else {
          console.log(data)
          this.content.innerHTML = data
        }
      })
    })
  }
}

customElements.define('file-explorer', FileExplorer)
