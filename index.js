const express = require('express')
const http = require('http')
const cookieParser = require('cookie-parser')

const config = require('./js/config.js')

let app = express()
let server = http.Server(app)

app.use(express.static(__dirname + '/public'))
app.use(express.json())
app.use(cookieParser())

//****************************************************************************************************
//Routing

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html')
})

app.post('/login', (req, res) => {
  res.send(JSON.stringify(config.login(req.body.user, req.body.password)))
})

app.post('/authentification', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)

  if (user) {
    config.users[user].token = config.generateToken()
    config.save()
  }

  res.send(JSON.stringify({
    error: user == null,
    user: user,
    token: user ? config.users[user].token : null
  }))
})

app.post('/logout', (req, res) => {
  res.send(JSON.stringify(config.deleteToken(req.body.token)))
})

app.get('*', (req, res) => {
	res.redirect('/')
})

//****************************************************************************************************
//Start server

server.listen(config.port, () => {
    console.log('serverUI started on port ' + config.port)
})
