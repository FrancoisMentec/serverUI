const TORRENTS_STATES_ICONS = {
  'Downloading': 'arrow_downward',
  'Seeding': 'arrow_upward',
  'Queued': 'swap_vert',
  'Paused': 'pause'
}

class TorrentUI extends HTMLElement {
  constructor () {
    super()

    this.topBar = document.createElement('div')
    this.topBar.classList.add('top-bar')
    this.appendChild(this.topBar)

    this.loginButton = new MButton('dns', () => {
      this.login()
    }, 'text icon', 'Login')
    this.topBar.appendChild(this.loginButton)

    let sep = document.createElement('div')
    sep.className = 'sep'
    this.topBar.appendChild(sep)

    this.showAllButton = new MButton('all_inclusive', () => {
      for (let [id, torrent] of Object.entries(this.torrents)) {
        torrent.visible = true
      }
    }, 'text icon', 'Show all torrents')
    this.topBar.appendChild(this.showAllButton)

    for (let [state, icon] of Object.entries(TORRENTS_STATES_ICONS)) {
      let button = new MButton(icon, () => {
        for (let [id, torrent] of Object.entries(this.torrents)) {
          //torrent.visible = torrent.state === state
          torrent.visibleState = state
        }
      }, 'text icon', 'Show ' + state.toLowerCase() + ' torrents only')
      this.topBar.appendChild(button)
    }

    this.content = new ScrollArea()
    this.content.classList.add('content')
    this.appendChild(this.content)

    this.torrents = {}

    this.update()
  }

  login () {
    let content = document.createElement('div')
    let url = new TextField('Url')
    url.style.width = '100%'
    content.appendChild(url)
    let password = new TextField('Password', 'password')
    password.style.width = '100%'
    content.appendChild(password)
    let message = document.createElement('p')
    content.appendChild(message)
    let dialog = new Dialog('Login to Deluge', content, {
      'CANCEL': () => {dialog.remove()},
      'LOGIN': () => {
        message.innerHTML = 'Connecting to deluge...'
        fetch('/deluge/login', {
          method: 'POST',
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: url.value,
            password: password.value
          })
        }).then(res => {
          res.json().then(data => {
            if (data.error) {
              message.innerHTML = `Failed to connect (${data.error.code})`
              console.error(data.error)
            } else {
              dialog.remove()
              this.update()
            }
          })
        })
      }
    })
    dialog.show()
    url.focus()
  }

  update () {
    fetch('/deluge/updateUI', {
      method: 'POST',
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        params: ["queue", "name", "total_wanted", "state", "progress", "num_seeds", "total_seeds", "num_peers", "total_peers", "download_payload_rate", "upload_payload_rate", "eta", "ratio", "distributed_copies", "is_auto_managed", "time_added", "tracker_host", "save_path", "total_done", "total_uploaded", "max_download_speed", "max_upload_speed", "seeds_peers_ratio"]
      })
    }).then(res => {
      res.json().then(data => {
        if (data.error) {
          console.error(data.error)
        } else {
          console.log(data.data.result.torrents)
          for (let [id, t] of Object.entries(data.data.result.torrents)) {
            if (typeof this.torrents[id] != 'undefined') {
              this.torrents[id].update(t)
            } else {
              let torrent = new Torrent(t)
              this.torrents[id] = torrent
              this.content.appendChild(torrent)
            }
          }
          setTimeout(() => {
            this.update()
          }, 1000)
        }
      })
    })
  }
}

customElements.define('torrent-ui', TorrentUI)

// Torrent

class Torrent extends HTMLElement {
  constructor (data) {
    super()

    this._visibleState = null

    this.progressBar = document.createElement('div')
    this.progressBar.classList.add('progress-bar')
    this.appendChild(this.progressBar)

    this._state = null
    this.stateDiv = document.createElement('div')
    this.stateDiv.classList.add('state')
    this.appendChild(this.stateDiv)

    this.nameDiv = document.createElement('div')
    this.nameDiv.classList.add('name')
    this.appendChild(this.nameDiv)

    this.sizeDiv = document.createElement('div')
    this.sizeDiv.classList.add('size')
    this.appendChild(this.sizeDiv)

    this._progress = null
    this.progressDiv = document.createElement('div')
    this.progressDiv.classList.add('progress')
    this.appendChild(this.progressDiv)

    this.update(data)
  }

  set visible (val) {
    this.classList.toggle('hidden', !val)
  }

  get visibleState () {
    return this._visibleState
  }

  set visibleState (val) {
    this._visibleState = val
    this.visible = val == null || val == this.state
  }

  get state () {
    return this._state
  }

  set state (val) {
    this._state = val
    this.stateDiv.innerHTML = TORRENTS_STATES_ICONS[val]
    this.visible = this.visibleState == null || this.visibleState == val
  }

  get progress () {
    return this._progress
  }

  set progress (val) {
    this._progress = val
    this.progressBar.style.width = val + '%'
    val = Math.round(val * 10) / 10
    let str = val
    if (val % 1 === 0)  str += '.0'
    str += '%'
    this.progressDiv.innerHTML = str
  }

  update (data) {
    this.nameDiv.innerHTML = data.name
    this.sizeDiv.innerHTML = hrSize(data.total_wanted)
    this.progress = data.progress
    this.state = data.state
  }
}


customElements.define('torrent-e', Torrent)
