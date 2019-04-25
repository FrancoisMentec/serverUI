let loginDiv = document.getElementById('login')
let loginUser = document.getElementById('login-user')
let loginPassword = document.getElementById('login-password')
let loginError = document.getElementById('login-error')

loginUser.focus()

loginUser.onEnter = () => {
  loginPassword.focus()
}

loginPassword.onEnter = () => {
  login()
}

function login() {
  fetch('/login', {
    method: 'POST',
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      login: loginUser.value,
      password: loginPassword.value
    })
  }).then(res => {
    res.json().then(data => {
      if (data.error) {
        loginError.innerHTML = data.message
      } else {
        loginDiv.classList.add('logged')
      }
    })
  })
}
