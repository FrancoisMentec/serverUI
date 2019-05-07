const SIZE_UNITS = ['o', 'Ko', 'Mo', 'Go', 'To']

let content = document.getElementById('content')
let fileExplorer = document.getElementById('file-explorer')
let panes = {}

for (let c = 0, lc = content.children.length; c < lc; c++) {
  panes[content.children[c].id] = content.children[c]
}

function show (id) {
  for (let c = 0, lc = content.children.length; c < lc; c++) {
    content.children[c].classList.toggle('hidden', content.children[c].id !== id)
  }
}

function setCookie (name, value, exdays) {
  let d = new Date()
  d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000))
  let expire = 'expires=' + d.toUTCString()
  document.cookie = name + "=" + value + ";" + expire + ";path=/"
}

function getCookie (name) {
  let regex = RegExp('(^\ *|;\ *)' + name + '=([^;]*)')
  let res = regex.exec(decodeURIComponent(document.cookie))
  return res !== null
    ? res[2]
    : null
}

function deleteCookie (name) {
  let d = new Date(0)
  let expire = 'expires=' + d.toUTCString()
  document.cookie = name + "=;" + expire + ";path=/"
}

function hrSize (size) {
  let u = 0
  while (size > 1024 && u < SIZE_UNITS.length - 1) {
    u++
    size = size / 1024
  }
  size = Math.round(size * 10) / 10
  let str = size
  if (size % 1 === 0) {
    str += '.0'
  }
  str += ' ' + SIZE_UNITS[u]
  return str
}
