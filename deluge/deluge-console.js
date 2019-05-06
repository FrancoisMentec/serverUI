const os = require('os')
const { exec } = require('child_process')

const COMMAND = os.platform() == 'win32'
  ? 'deluge-console'
  : 'deluge'

const regexState = new RegExp(/State: ([^ ]+)( Down Speed: ([\d.]+ \S+))?( Up Speed: ([\d.]+ \S+))?( ETA: (.+))?/)
const regexSeeds = new RegExp(/Seeds: (\d+) \((\d+)\) Peers: (\d+) \((\d+)\) Availability: ([\d.]+)/)
const regexSize = new RegExp(/Size: ([\d.]+ \w+)\/([\d.]+ \w+) Ratio: ([\d.]+)/)
const regexSeedTime = new RegExp(/Seed time: (.+) Active: (.+)/)
const regexTracker = new RegExp(/Tracker status: ([^:]+): (.+)/)
const regexProgress = new RegExp(/Progress: ([\d.]+)% (\[[#~]+\])/)
const regexFile = new RegExp(/    (.+) \(([\d.]+ \w+)\) Progress: ([\d.]+)% Priority: (\w+)/)

module.exports.info = function () {
  return new Promise((resolve, reject) => {
    exec(COMMAND + ' info -v', (err, stdout, stderr) => {
      if (err) reject(err)
      else if (stderr.length > 0) reject(new Error(stderr))
      else {
        console.log(stdout)
        stdout = stdout.split('\r\n')
        let r = []
        let torrent = null
        for (let i = 0, li = stdout.length; i < li; i++) {
          let line = stdout[i]
          if (line.startsWith('Name:')) {
            if (torrent != null) r.push(torrent)
            torrent = {
              name: line.substring(6),
              files: []
            }
          } else if (line.startsWith('ID:')) {
            torrent.id = line.substring(4)
          } else if (line.startsWith('State:')) {
            let e = regexState.exec(line)
            torrent.state = e[1]
            torrent.downSpeed = e[3] || null
            torrent.upSpeed = e[5] || null
            torrent.ETA = e[7] || null
          } else if (line.startsWith('Seeds:')) {
            let e = regexSeeds.exec(line)
            torrent.currentSeeders = e[1]
            torrent.seeders = e[2]
            torrent.currentLeechers = e[3]
            torrent.leechers = e[4]
            torrent.peersRatio = e[5]
          } else if (line.startsWith('Size:')) {
            let e = regexSize.exec(line)
            torrent.downloaded = e[1]
            torrent.size = e[2]
            torrent.downloadedRatio = e[3]
          } else if (line.startsWith('Seed time:')) {
            let e = regexSeedTime.exec(line)
            torrent.seedTime = e[1]
            torrent.active = e[2]
          } else if (line.startsWith('Tracker status:')) {
            let e = regexTracker.exec(line)
            torrent.tracker = e[1]
            torrent.trackerStatus = e[2]
          } else if (line.startsWith('Progress:')) {
            let e = regexProgress.exec(line)
            torrent.progress = e[1]
            torrent.progressBar = e[2]
          } else if (line == '  ::Files') {
            while (i < li - 1 && stdout[i+1].startsWith('    ')) {
              let e = regexFile.exec(stdout[++i])
              torrent.files.push({
                name: e[1],
                size: e[2],
                progress: e[3],
                priority: e[4]
              })
            }
          }
        }
        if (torrent != null) r.push(torrent)
        resolve(r)
      }
    })
  })
}

module.exports.add = function (torrent, saveLocation=__dirname) {
  return new Promise((resolve, reject) => {
    let command = COMMAND + ' add -p "' + saveLocation + '"'
    if (Array.isArray(torrent)) {
      for (let t of torrent) {
        command += ' ' + t
      }
    } else {
      command += ' ' + torrent
    }

    exec(command, (err, stdout, stderr) => {
      if (err) reject(err)
      else if (stderr.length > 0) reject(new Error(stderr))
      else {
        resolve(stdout)
      }
    })
  })
}

module.exports.remove = function (torrentId, removeData=false) {
  return new Promise((resolve, reject) => {
    let command = COMMAND + ' rm '
    if (removeData) {
      command += '--remove_data '
    }
    command += torrentId

    exec(command, (err, stdout, stderr) => {
      if (err) reject(err)
      else if (stderr.length > 0) reject(new Error(stderr))
      else {
        resolve(stdout)
      }
    })
  })
}
