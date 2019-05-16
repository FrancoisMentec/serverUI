const express = require('express')
const http = require('http')
const cookieParser = require('cookie-parser')
const fs = require('fs')
const fse = require('fs-extra')
const path = require('path')

const mfs = require('./js/my-fs.js')
const config = require('./js/config.js')
const deluge = require('./deluge/deluge.js')
const video = require('./js/video.js')

let app = express()
let server = http.Server(app)

app.use(express.static(__dirname + '/public'))
app.use(express.json())
app.use(cookieParser())

/*let videos = video.scanDir('/Users/Francois/Videos')
console.log(videos)*/

//****************************************************************************************************
// Deluge

let delugeClient = config.deluge.password != null
  ? deluge.Client(config.deluge.url, config.deluge.password)
  : null

if (delugeClient) {
  delugeClient.login().then(r => {
    console.log('Connected to deluge')
  }).catch(err => {
    console.error(err)
    delugeClient = null
  })
}

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
          if (typeof files[i].name === 'string' && files[i].name.length > 0 && files[i].name !== '.' && files[i].name !== '..') {
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

app.post('/remove-files', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['fileAccess'])) {
    let r = {
      error: false,
      filesError: [],
      filesSuccess: []
    }
    for (let f = 0; f < req.body.files.length; f++) {
      try {
        fse.removeSync(req.body.files[f])
        r.filesSuccess.push(req.body.files[f])
      } catch (err) {
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

app.post('/create-file', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['fileAccess'])) {
    let p = path.join(req.body.path, req.body.name)
    let error = false
    try {
      if (req.body.type == 'file') {
        let fd = fs.openSync(p, 'wx')
        fs.closeSync(fd)
      } else if (req.body.type == 'directory') {
        fs.mkdirSync(p)
      } else {
        throw new Error('Unknown type : ' + req.body.type)
      }
    } catch (err) {
      error = err
    }
    res.send({error: error})
  } else {
    res.send({error: new Error('Permission denied')})
  }
})

let shareLinks = {}

app.post('/generate-link', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['fileAccess'])) {
    let key = config.generateToken(16)
    shareLinks[key] = {
      path: req.body.path,
      user: user,
      expire: Date.now() + (req.body.days * 24 * 60 + req.body.hours * 60 + req.body.minutes) * 60 * 1000
    }
    res.send({
      error: false,
      key: key
    })
  } else {
    res.send({error: new Error('Permission denied')})
  }
})

app.get('/download/:key/:name?', (req, res) => {
  if (typeof shareLinks[req.params.key] === 'undefined') {
    res.send('Unknown key')
  } else if (Date.now() > shareLinks[req.params.key].expire) {
    res.send('Key expired')
  } else {
    res.sendFile(shareLinks[req.params.key].path.replace(/\\|\\\\/g, '/'))
  }
})

//****************************************************************************************************
// Deluge

app.post('/deluge/:action', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['delugeAccess'])) {
    if (req.params.action === 'login') {
      delugeClient = deluge.Client(req.body.url, req.body.password)
      delugeClient.login().then(() => {
        res.send({error: false})
        config.setDelugeInfo(req.body.url, req.body.password)
      }).catch(err => {
        res.send({error: err})
        delugeClient = null
      })
    } else if (delugeClient == null) {
      res.send({error: 'Deluge client is null, you need to login first'})
    } else if (req.params.action === 'updateUI') {
      delugeClient.updateUI(req.body.params).then(data => {
        res.send({
          error: false,
          data: data
        })
      }).catch(err => {res.send({error: err})})
    } else if (deluge.ALLOWED_ACTIONS.includes(req.params.action)) {
      delugeClient.request(req.body.params).then(r => {res.send({error: false, data: r.data})}).catch(err => {res.send({error: err})})
    } else {
      res.send({error: new Error('Unknown action : ' + req.params.action)})
    }
  } else {
    res.send({error: new Error('Permission denied')})
  }
})

//****************************************************************************************************
// Video

app.get('/videos/get/:id', (req, res) => {
  let user = config.getUserByToken(req.cookies.token)
  if (user != null && (user === 'root' || config.users[user]['videoAccess'])) {
    //res.sendFile(videos[req.params.id].path)
    res.send('Nothing here')
  } else {
    res.send({error: new Error('Permission denied')})
  }
})

// Default redirect
app.get('*', (req, res) => {
	res.redirect('/')
})

//****************************************************************************************************
//Start server

server.listen(config.port, () => {
    console.log('serverUI started on port ' + config.port)
})
