const path = require('path')
const axios = require('axios')

class Client {
  constructor (url, password, login=true) {
    this.nextId = 0
    if (!url.endsWith('/')) url += '/'
    this.url = url + 'json'
    this.password = password
    this.headers = {
      'Content-Type': 'application/json'
    }

    if (login) {
      this.login().then(r => {
        console.log('Connected to deluge')
      }).catch(err => {
        console.error(err)
      })
    }
  }

  request (method, params) {
    return new Promise((resolve, reject) => {
      axios.request({
        url: this.url,
        method: 'post',
        data: {
          method: method,
          params: params,
          id: this.nextId++
        },
        withCredentials: true,
        headers: this.headers
      }).then(res => {
        if (res.status != 200) reject(new Error(res.statusText))
        else if (res.data.error) reject(new Error(res.data))
        else resolve(res)
      }).catch(err => {
        reject(err)
      })
    })
  }

  login () {
    return new Promise((resolve, reject) => {
      this.request('auth.login', [this.password]).then(res => {
        this.headers['Cookie'] = res.headers['set-cookie'][0].split(';')[0]
        resolve()
      }).catch(error => {
        reject(error)
      })
    })
  }

  updateUI (params) {
    return new Promise((resolve, reject) => {
      this.request('web.update_ui', [params, {}]).then(res => {
        resolve(res.data)
      }).catch(err => {
        reject(err)
      })
    })
  }
}

module.exports.Client = function (url, password) {
  return new Client(url, password)
}
