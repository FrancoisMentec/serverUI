let loginDiv = document.getElementById('login')
let loginUser = document.getElementById('login-user')
let loginRememberMe = document.getElementById('login-remember-me')
let loginPassword = document.getElementById('login-password')

if (getCookie('token')) {
  fetch('/authentification', {
    method: 'POST'
  }).then(res => {
    res.json().then(data => {
      if (!data.error) {
        loginDiv.classList.add('logged')
        setCookie('token', data.token, 30)
      }
    })
  })
}

{
  let rememberMe = getCookie('login-remember-me')
  loginRememberMe.value = rememberMe != null
    ? rememberMe === 'true'
    : true
}

let rememberedUser = getCookie('login-remembered-user')
if (loginRememberMe.value && rememberedUser) {
  loginUser.value = rememberedUser
  loginPassword.focus()
} else {
  loginUser.focus()
}

loginUser.onEnter = () => {
  loginPassword.focus()
}

loginPassword.onEnter = () => {
  login()
}

function login() {
  loginUser.error = ''
  loginPassword.error = ''

  setCookie('login-remember-me', loginRememberMe.value, 30)
  if (loginRememberMe.value) {
    setCookie('login-remembered-user', loginUser.value, 30)
  } else {
    deleteCookie('login-remembered-user')
  }

  fetch('/login', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      user: loginUser.value,
      password: loginPassword.value
    })
  }).then(res => {
    res.json().then(data => {
      if (data.error) {
        if (data.message.includes('user')) {
          loginUser.error = data.message
        } else {
          loginPassword.error = data.message
        }

      } else {
        if (!loginRememberMe.value) {
          loginUser.value = ''
        }
        loginPassword.value = ''
        loginDiv.classList.add('logged')
        setCookie('token', data.token, 30)
      }
    })
  })
}

function logout () {
  loginDiv.classList.remove('logged')
  if (loginRememberMe.value) {
    loginPassword.focus()
  } else {
    loginUser.focus()
  }


  fetch('/logout', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      token: getCookie('token')
    })
  }).then(res => {
    res.json().then(data => {
      if (data.error) {
        console.error(data)
      }
    })
  })
  deleteCookie('token')
}
