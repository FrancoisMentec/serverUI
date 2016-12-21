# serverUI
It's a web UI built with nodejs to manage your computer from everywhere in a browser
It works with nodejs sever side, jQuery client side (no framework used) and socket.io to communicate with server

## Configure
Open config.json
password is the password to connect (default 'pass')
port is the port which the web server is started (default 8000)
musicDirectories is an array with the path of every folder where you want to search for music (default [])

## Install
Install node.js

On windows start Node.js command prompt
On linux just open a terminal

Go in your project and run `npm install`

Now you can start the server : `node index.js`

Open the app in any browser, the url is : http://*your_ip*:*port* (default port is 8000)

## Apps

### Dashboard
#### Done :
 * display OS information
 * display uptime
 * display memory
 * display disk memory
 
#### TODO :
 * shutdown/restart server
 * restart serverUI

### Files
#### Done :
 * can navigate throught files
 * can search inside current directory
 * can create new file/folder
 * can download a file
 * can open a file in the notepad app
 
#### TODO :
 * delete/rename/move file/folder
 * connect music file with Music app
 * download multiple files
 * execute a file
 
### Notepad
Use ace text editor from c9
#### Done :
 * can open a file
 * edit/save it
 
#### TODO :
 * change langage for text coloration (js, python, c, ...)
 
### Music
Use html5 audio tag to read music, id3 for metadata like title, artist or album and itunes api for cover
#### Done :
 * display every music in musicDirectories (see configure)
 * can read music
 * display music by artist/album
 * can search for an artist/album/music
 * basic command (pause/resume, previous/next, volume, mode)
 * reading mode normal (top at the end of playlist), loop_all (repeat the entire playlist), loop_one (repeat current music), random (go to a random music in playlist exept current music)
 * share give a link to share music with someone
 
#### TODO :
 * display music current time and duration
 * add the possibility to create playlist
 * like music
 * add/remove musicDirectories