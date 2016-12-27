var express = require('express');
var app = express();
var http = require('http');
var server = http.Server(app);
var io = require('socket.io')(server);
var fs = require('fs');
var df = require('node-df');
var os = require('os');
var sqlite3 = require('sqlite3');
var mm = require('musicmetadata');
var Sync = require('sync');

app.use(express.static(__dirname+"/public"));

//****************************************************************************************************
//Config
console.log("Reading config file (config.json) ...")
var config = {
  "password": "pass",
  "port": 8000,
  "musicDirectories": []
};

try{
	var content = fs.readFileSync(__dirname+"/config.json");
	config = JSON.parse(content);
}catch(err){
	console.log("Can't find config.json, default configuration loaded");
}


//****************************************************************************************************
//Database
var db = new sqlite3.Database(__dirname+"/database.sqlite3");

//****************************************************************************************************
//Routing
app.get("/download/:key", function(req, res){
	//var path = decodeURIComponent(req.url.slice(9));
  var path = FileAPI.getDownloadPath(req.params.key);
  if(path!=null){
    res.sendFile(path);
  }else{
    res.status(404).send("Invalid key "+req.params.key);
  }
});

app.get("/music/:id", function(req, res){
	MusicAPI.getPath(req.params.id, function(err, path){
		if(err){
			console.log(err);
		}

		if(path){
			res.sendFile(path);
		}else{
			res.status(404).send("Can't find this music");
		}
	});
});

app.get("/music/cover/:id", function(req, res){
	//https://itunes.apple.com/search?term=jack+johnson&limit=1
	MusicAPI.getMusic(req.params.id, function(err, music){
		if(music.cover==MusicAPI.defaultCover){
			var properTitle = music.title.replace(new RegExp(/[^A-Za-z0-9 ]/, 'g'), "");
			var properArtist = music.artist.replace(new RegExp(/[^A-Za-z0-9 ]/, 'g'), "");
			var term = (properTitle+"+"+properArtist).replace(new RegExp(" +", 'g'), "+");
			var url = "http://itunes.apple.com/search?term="+term+"&limit=1";
			http.get(url, function(itunesRes) {
        var statusCode = itunesRes.statusCode;
				var body = "";

        if (statusCode !== 200) {
          console.log('itunes API returned an error for '+url);
          res.redirect(music.cover);
          return
        }

				itunesRes.on("data", function(chunk){
		        body += chunk;
		    });

				itunesRes.on('end', function(){
		        var json = JSON.parse(body);
						var cover = music.cover;
						if(json.resultCount>0){
							cover = json.results[0].artworkUrl100;
							MusicAPI.setCover(req.params.id, cover);
						}
						res.redirect(cover);
		    });
			}).on('error', function(error){
        console.log('Failed to load '+url+' check your internet connection');
        res.redirect(music.cover);
      });
		}else{
			res.redirect(music.cover);
		}
	});
});

app.get("*", function(req, res){
	res.sendFile(__dirname+"/public/index.html");
});

//****************************************************************************************************
//Socket
io.on('connection', function (socket) {
    new User(socket);
});

//****************************************************************************************************
//File api
var FileAPI = (function(FileAPI){
  FileAPI.charForRandomKey = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'; //char used to generate random key
  FileAPI.defaultKeyLength = 32; //default key length
  FileAPI.downloadLink = {}; //key is a random id, value is the path

  //Generate random key for download link
  FileAPI.getRandomKey = function(length=FileAPI.defaultKeyLength){
    var key = '';
    for(var i=0;i<length;i++){
      key += FileAPI.charForRandomKey.charAt(Math.floor(Math.random()*FileAPI.charForRandomKey.length));
    }
    return key;
  }

  //Return a key to download given file
  FileAPI.getDownloadKey = function(path){
    var key = null;
    while(key==null || typeof FileAPI.downloadLink[key] != 'undefined'){
      key = FileAPI.getRandomKey();
    }
    FileAPI.downloadLink[key] = path; //Store path under key
    return key;
  }

  //Return path for given key
  FileAPI.getDownloadPath = function(key){
    if(typeof FileAPI.downloadLink[key] == 'undefined'){
      console.log("FileAPI.getDownloadPath key "+key+" doesn't exists");
      return null;
    }
    var path = FileAPI.downloadLink[key];
    delete FileAPI.downloadLink[key]; //Can be used only once
    return path;
  }

  //Just return name of file from given path
  FileAPI.getNameFromPath = function(path){
    return path.slice(path.lastIndexOf('/')+1);
  }

  return FileAPI;
})({});

//****************************************************************************************************
//Music api
var MusicAPI = (function(MusicAPI){
	MusicAPI.supportedCodingFormat = [".wav", ".mp3", ".mp4", ".ogg", ".webm", ".wma", ".wmv"]; //Supported audio coding format
	//Directories where to search music
	MusicAPI.directories = config.musicDirectories;
	MusicAPI.defaultCover = "/image/defaultCover.png";

	//Create Database
	MusicAPI.buildDB = function(callback){
		//Create music table
		db.run("CREATE TABLE IF NOT EXISTS music ("+
			"id INTEGER PRIMARY KEY AUTOINCREMENT,"+
			"title STRING NOT NULL,"+
			"artist STRING DEFAULT 'Unknown artist',"+
			"album STRING DEFAULT 'Unknown album',"+
			"year INTEGER DEFAULT -1,"+
			"genre STRING DEFAULT 'Unknown genre',"+
			"duration REAL NOT NULL,"+
			"cover STRING DEFAULT '"+MusicAPI.defaultCover+"',"+
			"path STRING NOT NULL UNIQUE"+
		")", function(error){
          if(error){
            console.log(error);
          }else{
            var nbMusicFound = 0;
        		for(var d in MusicAPI.directories){
        			nbMusicFound += MusicAPI.searchMusic(MusicAPI.directories[d]);
        		}
            if(typeof callback == 'function'){
              callback(nbMusicFound);
            }
          }
    });
	}

	//Search music inside given directory and all subdirectories (Function is not recursive)
	MusicAPI.searchMusic = function(directory){
		var nbMusicFound = 0; //Nb music found
		var stack = [];
		stack.push(directory);

		while(stack.length>0){
			var dir = stack.pop();
			if(dir.indexOf("/", dir.length-1)==-1){
				dir = dir+"/";
			}

			try{
				var files = fs.readdirSync(dir);
				for(var f in files){
					var fileName = files[f].toString('utf8');
					var filePath = dir+fileName;

					var stat = fs.statSync(filePath);
					if(stat.isFile()){
						var isSupportedMusic = false;
						for(var f in this.supportedCodingFormat){
							if(fileName.indexOf(this.supportedCodingFormat[f]) != -1){
								isSupportedMusic = true;
								break;
							}
						}

						if(isSupportedMusic){
							nbMusicFound++; //Inc nb music found
							Sync(function(){
								var fn = fileName;
								var fp = filePath;
								var readableStream = fs.createReadStream(fp);
								var metadata = mm.sync(null, readableStream);

								var title = fn;
								if(metadata.title.length>0){
									title = metadata.title;
								}

								var artist = "Unknown artist";
								if(metadata.artist.length>0 && metadata.artist[0].length>0){
									artist = metadata.artist[0];
								}

								var album = "Unknown album";
								if(metadata.album.length>0){
									album = metadata.album;
								}

								var year = parseInt(metadata.year, 10);
								if(isNaN(year)){
									year = -1;
								}

								var genre = "Unknown genre";
								if(metadata.genre.length>0){
									genre = metadata.genre[0];
									for(var i=1;i<metadata.genre.length;i++){
										genre += ":"+metadata.genre[i];
									}
								}
								db.run("INSERT INTO music (title, artist, album, year, genre, duration, path) VALUES (?, ?, ?, ?, ?, ?, ?)",
									[title, artist, album, year, genre, metadata.duration, fp],
									function(error){ if(error && error.code!="SQLITE_CONSTRAINT") console.log(error); });
								readableStream.close();
							});
						}else{
							//console.log(filePath+" isn't a supported music");
						}
					}else if(stat.isDirectory()){ //If filePath is a directory it's added to the stack
						stack.push(filePath);
					}
				}//For on files end
			}catch(err){
				console.log(err);
			}
		}//End while
		return nbMusicFound; //Return nb music found
	}

	//Return all musics in an array
	MusicAPI.getMusics = function(callback){
		db.all("SELECT id, title, artist, album, year, genre, duration FROM music", function(err, rows) {
	      if(err){
					console.log(err);
				}else{
					for(var r in rows){
						rows[r].title = String(rows[r].title);
						rows[r].artist = String(rows[r].artist);
						rows[r].album = String(rows[r].album);
					}
					callback(rows);
				}
	  });
	}

	MusicAPI.getMusic = function(id, callback){
		db.get("SELECT * FROM music WHERE id=?", [id], function(err, row) {
			callback(err, row);
	  });
	}

	//Call callback with err and path (for given id) as parameter
	MusicAPI.getPath = function(id, callback){
		db.get("SELECT path FROM music WHERE id=?", [id], function(err, row){
			var path = false;
			if(typeof row != "undefined"){
				path = row.path;
			}
			callback(err, path);
		});
	}

	MusicAPI.setCover = function(id, cover){
		db.run("UPDATE music SET cover=? WHERE id=?", [cover, id], function(err){
			if(err){
				console.log(err);
			}
		});
	}

	return MusicAPI;
})({});

//****************************************************************************************************
//User object
function User(socket){
    var that = this;
    this.socket = socket;
    this.authentified = false;
    this.updateOSInfoTimeout = false;

    this.socket.on("message", function (message) {
      that.handleMessage(message);
    });
}

User.prototype.sendMessage = function(action, data){
  var message = data;
  message.action = action;
  this.socket.emit("message", message);
}

User.prototype.handleMessage = function(message){
  var self = this;
  if(message.action=="authentification"){
    self.authentified = (message.password === config.password);
    self.sendMessage("authentification", {authentified: self.authentified});
  }else if(self.authentified){//Functions which require authentification
      if(message.action=="getDirectoryContent"){
        self.getDirectoryContent(message.path);
      }else if(message.action=="getOSInformation"){
          df(function(err, disk) {
            if(err){
              disk = false;
            }

            self.sendMessage("OSInformation", {
                          arch: os.arch(),
                          freemem: os.freemem(),
                          totalmem: os.totalmem(),
                          hostname: os.hostname(),
                          type: os.type(),
                          platform: os.platform(),
                          release: os.release(),
                          uptime: os.uptime(),
                          disk: disk
                      });

            self.updateOSInfoTimeout = setTimeout(function(){ self.updateOSInfo(); }, 1000);
          });
      }else if(message.action=="createFile"){
        self.createFile(message.path, message.name, message.type);
      }else if(message.action=="openDocument"){
          fs.readFile(message.path, "utf8", function(err, data){
            self.sendMessage("openDocument", {path: message.path, name: message.name, content: data, error: err});
          });
      }else if(message.action=="saveDocument"){
          fs.writeFile(message.path, message.content, "utf8", function(err){
              self.sendMessage("saveDocument", {path: message.path, name: message.name, error: err});
          });
      }else if(message.action=="downloadFile"){
          self.sendMessage("downloadFile", {path: message.path, name: FileAPI.getNameFromPath(message.path), link: "/download/"+FileAPI.getDownloadKey(message.path)});
      }else if(message.action=="downloadDirectory"){ //TODO Doesn't work currently
          var zip = new AdmZip();
          zip.addLocalFolder(message.path);
          //fs.rmdirSync(__dirname+"/public/download/"+message.name+".zip");
          //need to create file : __dirname+"/public/download/"+message.name+".zip"
          zip.writeZip(__dirname+"/public/download/"+message.name+".zip");
          self.sendMessage("downloadLink", {link: "/download/"+message.name+".zip", name: message.name});
      }else if(message.action=="getMusics"){
        MusicAPI.getMusics(function(musics){
          self.sendMessage("setMusics", {musics: musics});
        });
      }
  }
}

//Send updated OS informations
User.prototype.updateOSInfo = function(){
    var that = this;
    df(function(err, disk) {
			if(err){
				disk = false;
			}

	    that.socket.emit("message", {
	        action: "updateOSInformation",
	        freemem: os.freemem(),
	        totalmem: os.totalmem(),
	        uptime: os.uptime(),
	        disk: disk});

	    that.updateOSInfoTimeout = setTimeout(function(){ that.updateOSInfo(); }, 1000);
    });
}

//Get the content of the given directory
User.prototype.getDirectoryContent = function(path){
	if(typeof path != "undefined"){
		var pathFromClient = path;
		if(path.indexOf("/", path.length-1)==-1){
			path = path+"/";
		}

		var files = [];
		var error = false;
		try{
			var filesName = fs.readdirSync(path);
			for(var f in filesName){
				var fileName = filesName[f].toString('utf8');
				var filePath = path+fileName;
				try{
					var stat = fs.statSync(filePath);
					var fileType = "directory";
					if(stat.isFile()){
						fileType = "file";
					}
					var fileSize = stat["size"];
				}catch(err){
					console.log("getDirectoryContent("+path+") > fs.statSync("+filePath+"), edit code to show the error");
					//console.log(err);
					var fileType = "unknow";
					var fileSize = -1;
				}

				files.push({name: fileName, path: filePath, type: fileType, size: fileSize});
			}
		}catch(err){
			error = err;
			console.log("getDirectoryContent("+path+") > fs.readdirSync("+path+"), edit code to show the error");
			//console.log(err);
		}

		this.socket.emit("message", {action: "directoryContent", path: pathFromClient, files: files, error: error});
	}else{
		console.log("getDirectoryContent Error, path is undefined");
	}
}

//Create a file/folder
User.prototype.createFile = function(path, name, type){
	if(path.indexOf("/", path.length-1)==-1){
		path = path+"/";
	}
	path += name;
	var error = false;

	if(type == "file"){
		try{
			var fd = fs.openSync(path, 'wx');
			fs.closeSync(fd);
		}catch(err){
			console.log("createFile("+path+", "+name+", "+type+") error");
			//console.log(err);
			error = err;
		}
	}else if(type == "folder"){
		try{
			fs.mkdirSync(path);
		}catch(err){
			console.log("createFile("+path+", "+name+", "+type+") error");
			//console.log(err);
			error = err;
		}
	}else{
		error = "Invalid type : "+type;
	}

	this.socket.emit("message", {action: "fileCreation", path: path, name: name, type: type, error: error});
}

//****************************************************************************************************
//Start server
console.log("MusicAPI build db...");
console.time("buildDB");
MusicAPI.buildDB(function(n){
  console.timeEnd("buildDB");
  console.log(n+" musics found, musicmetadata is currently parsing them");

  server.listen(config.port, function(){
      console.log("serverUI started on port "+config.port);
  });
});
