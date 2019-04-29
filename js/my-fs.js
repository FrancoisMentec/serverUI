const fs = require('fs')
const path = require('path')

module.exports.copy = function (source, destination) {
  try {
    let stat = fs.statSync(source)
    if (stat.isDirectory()) {
      let snap = snapshot(source, destination)
      fs.mkdirSync(destination)
      _copy(snap)
    } else {
      fs.copyFileSync(source, destination, fs.constants.COPYFILE_EXCL)
    }
  } catch (err) {
    throw(err)
  }
}

function _copy(snap) {
  for (let i = 0; i < snap.length; i++) {
    if (snap[i].type === 'directory') {
      fs.mkdirSync(snap[i].destination)
      _copy(snap[i].content)
    } else {
      fs.copyFileSync(snap[i].source, snap[i].destination, fs.constants.COPYFILE_EXCL)
    }
  }
}

function snapshot (source, destination) {
  let r = []
  let files = fs.readdirSync(source)
  for (let f = 0; f < files.length; f++) {
    let p = path.join(source, files[f])
    let stat = fs.statSync(p)
    let t = {
      source: p,
      destination: path.join(destination, files[f]),
      type: 'file'
    }
    if (stat.isDirectory()) {
      t.type = 'directory'
      t.content = snapshot(p, path.join(destination, files[f]))
    }
    r.push(t)
  }
  return r
}
