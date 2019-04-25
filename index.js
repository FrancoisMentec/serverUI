const express = require('express')
const http = require('http')
const argon2 = require('argon2')

var app = express()
var server = http.Server(app)

app.use(express.static(__dirname + '/public'))

//****************************************************************************************************
//Config

try {
  const hash = argon2.hash("password");
  console.log(hash)
} catch (err) {
  //...
}

console.log('Loading config from config.json ...')
var config = {
  'port': 8000,
  'users': {
    'root': {
      'password': 1,
      'type': 'root'
    }
  }
}

try {
	var content = fs.readFileSync(__dirname + '/config.json')
	config = JSON.parse(content)
} catch(err) {
	console.log('Can\'t find config.json, default configuration loaded')
}

//****************************************************************************************************
//Routing

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

app.get('*', (req, res) => {
	res.redirect('/')
})

//****************************************************************************************************
//Start server

server.listen(config.port, () => {
    console.log('serverUI started on port ' + config.port)
})
