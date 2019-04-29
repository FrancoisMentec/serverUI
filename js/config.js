const fs = require('fs')

const CONFIG_PATH = './config.json'
const DEFAULT_CONFIG = {
  'port': 8000,
  'users': {
    'root': {
      'name': 'root',
      'password': 'root'
    }
  }
}
const TOKEN_LENGTH = 64
const TOKEN_CHARS = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'

let instanciated = false

class Config {
  constructor () {
    if (instanciated) {
      console.err('A config is already instanciated')
      process.exit(1)
    } else {
      instanciated = true
    }

    this.config = null

    try {
      if (!fs.existsSync(CONFIG_PATH)) {
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG))
      }
      this.config = JSON.parse(fs.readFileSync(CONFIG_PATH))
    } catch (err) {
    	console.error(err)
      console.error(new Error('Default config used'))
      this.config = DEFAULT_CONFIG
    }
  }

  get port () {
    return this.config.port
  }

  get users () {
    return this.config.users
  }

  login (user, password) {
    let r = {
      error: true,
      message: null
    }
    if (typeof this.users[user] != 'undefined') {
      if (this.users[user].password === password) {
        r.error = false
        r.message = 'Logged'
        r.token = this.generateToken()
        this.users[user].token = r.token
        this.save()
      } else {
        r.message = 'Wrong password'
      }
    } else {
      r.message = 'Unknown user'
    }
    return r
  }

  generateToken () {
    let token = ''
    for (let i = 0; i < TOKEN_LENGTH; i++) {
      token += TOKEN_CHARS[Math.floor(Math.random() * TOKEN_CHARS.length)]
    }
    return token
  }

  deleteToken (token) {
    let user = this.getUserByToken(token)
    if (user) {
      this.users[user].token = null
      this.save()
    }
    return {
      error: user ? false : true,
      message: user ? null : 'Unknown token'
    }
  }

  getUserByToken (token) {
    for (let user in this.users) {
      if (typeof this.users[user].token !== 'undefined' && this.users[user].token === token) {
        return user
      }
    }
    return null
  }

  save () {
    fs.writeFile(CONFIG_PATH, JSON.stringify(this.config), () => {})
  }
}

module.exports = new Config()
