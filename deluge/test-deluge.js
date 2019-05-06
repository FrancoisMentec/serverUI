const deluge = require('./deluge.js')

/*deluge.add('Charlie_Chaplin_Mabels_Strange_Predicament.avi.torrent').then(r => {
  console.log(r)
}).catch(err => {
  console.error(err)
})

deluge.info().then(r => {
  console.log(r)
  for (let t of r) {
    deluge.remove(t.id, true).then(() => {
      console.log(t.name + ' removed')
    }).catch(console.error)
  }
}).catch(err => {
  console.error(err)
})*/

let client = deluge.Client('', '')

client.login().then(() => {
  client.updateUI(['name'])
}).catch(console.error)

//
