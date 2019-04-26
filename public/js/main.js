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
