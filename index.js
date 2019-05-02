const express = require('express')
const http = require('http')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const path = require('path')

const mfs = require('./js/my-fs.js')
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

// Login
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

//****************************************************************************************************
// File Explorer
app.post('/directory-content', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['fileAccess'])) {
    fs.readdir(req.body.path, {withFileTypes: true}, (err, files) => {
      if (err) {
        res.send(JSON.stringify({
          error: err
        }))
      } else {
        let f = []
        for (let i = 0, li = files.length; i < li; i++) {
          let filePath = path.join(req.body.path, files[i].name)
          let fd = {
            name: files[i].name,
            path: filePath,
            type: files[i].isDirectory() ? 'directory' : files[i].isFile() ? 'file' : 'other'
          }
          try {
            let stats = fs.statSync(filePath)
            fd.size = stats.size
          } catch (err) {
            fd.size = null
            fd.error = err
          }
          f.push(fd)
        }
        res.send(JSON.stringify({
          error: false,
          files: f
        }))
      }
    })
  } else {
    res.send(JSON.stringify({
      error: new Error('Permission denied')
    }))
  }
})

app.post('/copy-files', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['fileAccess'])) {
    let r = {
      error: false,
      filesError: [],
      filesSuccess: []
    }
    for (let f = 0; f < req.body.files.length; f++) {
      try {
        let dest = path.join(req.body.destination, path.basename(req.body.files[f]))
        mfs.copy(req.body.files[f], dest)
        r.filesSuccess.push(req.body.files[f])
      } catch (err) {
        console.error(err)
        r.error = true
        r.filesError.push({
          file: req.body.files[f],
          error: err
        })
      }
    }
    res.send(JSON.stringify(r))
  } else {
    res.send(JSON.stringify({
      error: new Error('Permission denied')
    }))
  }
})

app.post('/rename-file', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['fileAccess'])) {
    fs.rename(req.body.path, path.join(path.dirname(req.body.path), req.body.name), err => {
      res.send(JSON.stringify({
        error: err
      }))
    })
  } else {
    res.send(JSON.stringify({
      error: new Error('Permission denied')
    }))
  }
})

app.get('*', (req, res) => {
	res.redirect('/')
})

//****************************************************************************************************
//Start server

server.listen(config.port, () => {
    console.log('serverUI started on port ' + config.port)
})
