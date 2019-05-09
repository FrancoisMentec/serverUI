const path = require('path')
const axios = require('axios')

const ALLOWED_ACTIONS = ['web.get_torrent_info', 'core.resume_torrent', 'web.download_torrent_from_url']

module.exports.ALLOWED_ACTIONS = ALLOWED_ACTIONS

class Client {
  constructor (url, password) {
    this.nextId = 0
    if (!url.endsWith('/')) url += '/'
    this.url = url + 'json'
    this.password = password
    this.headers = {
      'Content-Type': 'application/json'
    }
  }

  request (method, params) {
    return new Promise((resolve, reject) => {
      let req = {
        url: this.url,
        method: 'post',
        data: {method: method,
          params: params,
          id: this.nextId++
        },
        withCredentials: true,
        headers: this.headers
      }
      axios.request(req).then(res => {
        if (res.status != 200) reject(new Error(res.statusText))
        else if (res.data.error) {
          if (res.data.error.message === 'Not authenticated' && method !== 'auth.login') {
            this.login().then(() => {
              axios.request(req).then(res => {
                if (res.status != 200) reject(new Error(res.statusText))
                else if (res.data.error) reject(new Error(res.data))
                else resolve(res)
              }).catch(reject)
            }).catch(reject)
          } else {
            reject(new Error(res.data))
          }
        }
        else resolve(res)
      }).catch(reject)
    })
  }

  login () {
    return new Promise((resolve, reject) => {
      this.request('auth.login', [this.password]).then(res => {
        this.headers['Cookie'] = res.headers['set-cookie'][0].split(';')[0]
        resolve()
      }).catch(err => {
        err.request = null
        reject(err)
      })
    })
  }

  updateUI (params) {
    return new Promise((resolve, reject) => {
      this.request('web.update_ui', [params, {}]).then(res => {
        resolve(res.data)
      }).catch(reject)
    })
  }
}

module.exports.Client = function (url, password) {
  return new Client(url, password)
}
