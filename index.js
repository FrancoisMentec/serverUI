const fs = require('fs')
const express = require('express')
const http = require('http')

let app = express()
let server = http.Server(app)

app.use(express.static(__dirname + '/public'))
app.use(express.json())

//****************************************************************************************************
//Config

const CONFIG_PATH = __dirname + '/config.json'
const DEFAULT_CONFIG = {
  'port': 8000,
  'users': {
    'root': {
      'password': 'root',
      'type': 'root'
    }
  }
}
let config = null

try {
  if (!fs.existsSync(CONFIG_PATH)) {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(DEFAULT_CONFIG))
  }
  config = JSON.parse(fs.readFileSync(CONFIG_PATH))
} catch(err) {
	console.err(err)
  process.exit(1)
}

//****************************************************************************************************
//Routing

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

app.post('/login', (req, res) => {
  let r = {
    error: true,
    message: null
  }
  if (typeof config.users[req.body.login] != 'undefined') {
    if (config.users[req.body.login].password === req.body.password) {
      r.error = false
      r.message = 'Logged'
    } else {
      r.message = 'Wrong password'
    }
  } else {
    r.message = 'Unknown user'
  }
  res.send(JSON.stringify(r))
})

app.get('*', (req, res) => {
	res.redirect('/')
})

//****************************************************************************************************
//Start server

server.listen(config.port, () => {
    console.log('serverUI started on port ' + config.port)
})
