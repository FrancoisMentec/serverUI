const fs = require('fs')
const path = require('path')

const VIDEO_EXTENSION = ['webm', 'mkv', 'flv', 'vob', 'ogv', 'ogg', 'avi', 'wmv', 'mp4', 'm4p', 'm4v', 'mpg', 'mp2', 'mpeg']
const REPAIR_PATH_REGEX = new RegExp('\\\\', 'g') // else sendFile will fail

function isVideo (name) {
  return VIDEO_EXTENSION.includes(name.slice(-3))
}

function scanDir (dir) {
  let files = fs.readdirSync(dir, {withFileTypes: true})
  let videos = []
  for (let f = 0; f < files.length; f++) {
    let file = files[f]
    if (file.isFile() && isVideo(file.name)) {
      videos.push({
        name: file.name,
        path: path.join(dir, file.name).replace(REPAIR_PATH_REGEX, '/')
      })
    } else if (file.isDirectory()) {
      videos = videos.concat(scanDir(path.join(dir, file.name)))
    }
  }
  return videos
}

module.exports.scanDir = scanDir
