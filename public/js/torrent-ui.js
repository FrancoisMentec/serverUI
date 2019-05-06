class TorrentUI extends HTMLElement {
  constructor () {
    super()

    this.topBar = document.createElement('div')
    this.topBar.classList.add('top-bar')
    this.appendChild(this.topBar)

    this.loginButton = new MButton('content_copy', () => {
      this.login()
    }, 'text icon', 'Login')
    this.topBar.appendChild(this.loginButton)

    this.content = document.createElement('div')
    this.appendChild(this.content)

    this.torrentList = {}

    this.update()
  }

  login () {
    let content = document.createElement('div')
    let url = new TextField('Url')
    content.appendChild(url)
    let password = new TextField('Password', 'password')
    content.appendChild(password)
    let dialog = new Dialog('Login to Deluge', content, {
      'CANCEL': () => {dialog.remove()},
      'LOGIN': () => {
        console.log('TODO')
      }
    })
    dialog.show()
    url.focus()
  }

  update () {

  }
}

customElements.define('torrent-ui', TorrentUI)
