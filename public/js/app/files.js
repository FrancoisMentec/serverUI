serverUI.app("files", "folder", function(app){
	var self = this;
	this.path = "/";
	this.files = [];
	this.selectedFiles = [];

	// ui
	this.topBar = $("<div>").addClass("subTopBar dark").appendTo(app.content);

	this.pathDiv = $("<span>").addClass("pathDiv").html("Loading...").appendTo(this.topBar);

	this.topBarLeftPane = $("<div>").addClass("topBarLeftPane").appendTo(this.topBar);

	this.directoryContent = $("<div>").addClass("content").appendTo(app.content);

	// new file ui
	this.newButton = $("<button>").addClass("flatButton iconButton").html('<i class="material-icons">add</i>').click(function(){
		self.newPopup.show();
	}).appendTo(this.topBarLeftPane);

	this.newPopupContent = $("<div>");
	this.newFileName = new TextField("File name", this.newPopupContent);
	this.newPopupContent.append("<br>");
	this.isFile = new RadioButton("newFileType", "file", "File", this.newPopupContent, true);
	this.isFolder = new RadioButton("newFileType", "folder", "Folder", this.newPopupContent);

	this.newPopup = new Popup("Create a new File/Folder", this.newPopupContent, function(popup){ self.createNew(popup); }, true);

	//file creation popup
	this.fileCreationPopupContent = $("<div>");
	this.fileCreationPopup = new Popup("File creation", this.fileCreationPopupContent);

	//search
	this.topBarLeftPane.append("<hr class='vr'>");
	this.searchInput = new TextField("Search", this.topBarLeftPane, false, false, false, true);
	this.searchInput.keyup(function(){ self.search(); });

	//Functions
	this.goTo = function(path = false){
		if(path){
			self.path = path;
		}else{
			path = self.path;
		}
		self.files = [];
		self.selectedFiles = [];

		//Display path
		self.pathDiv.empty();
		var dirs = self.path.split("/");
		if(dirs.length > 1 && dirs[dirs.length-1].length == 0){
			dirs.splice(dirs.length-1, 1);
		}
		for(var d in dirs){
			var path = "/";
			for(var i=0;i<d;i++){
				if(dirs[i].length > 0){
					path += dirs[i] + "/";
				}
			}
			var name = "/";
			if(dirs[d].length > 0){
				path += dirs[d] + "/";
				name = dirs[d];
			}
			self.pathDiv.append($("<button>").addClass("flatButton pathButton").attr("path", path).html(name).click(function(){ self.goTo($(this).attr("path")); }));
			if(d < dirs.length - 1){
				self.pathDiv.append($("<i>").addClass("material-icons").html("chevron_right"));
			}
		}

		self.directoryContent.empty();
		serverUI.emit("getDirectoryContent", {path: self.path});
	}

	this.showFiles = function(files = self.files){
		//detach files (don't break events)
		for(var f in self.files){
			self.files[f].div.detach();
		}
		//display files
		for(var f in files){
			self.directoryContent.append(files[f].div);
		}
	}

	this.selectFile = function(file){
		self.selectedFiles.push(file);
	}

	this.unselectFile = function(file){
		for(var f in self.selectedFiles){
            if(self.selectedFiles[f]==file){
                self.selectedFiles.splice(f, 1);
				break;
            }
        }
	}

	this.unselectAllFiles = function(){
		for(var f in self.selectedFiles){
			self.selectedFiles[f].unselect();
		}
	}

	this.createNew = function(popup){
		var type = $("input[name=newFileType]:checked").val()
		var name = self.newFileName.val();
		serverUI.emit("createFile", {path: self.path, name: name, type: type});
		popup.hide();
	}

	this.search = function(){
		var str = self.searchInput.val().toLowerCase();
		var files = [];
		for(var f in self.files){
			if(self.files[f].name.toLowerCase().indexOf(str) !== -1){
				files.push(self.files[f]);
			}
		}
		self.showFiles(files);
	}

	this.downloadFile = function(path){
		serverUI.emit("downloadFile", {path: path});
	}

	// Events
	app.onServer("authentification", function(data){
		if(data.authentified){
			self.goTo(self.path);
		}
	});

	app.onServer("directoryContent", function(data){
		if(self.path == data.path){
			if(!data.error){
				for(var f in data.files){
					self.files.push(new File(data.files[f], self));
				}
				self.showFiles();
			}else{
				var message = "Error, check the console or the server";
				console.log(data.error);
				if(data.error.code=="EPERM"){
					message = "Can't access to "+data.error.path+", try to restart the server as root";
				}
				self.directoryContent.html(message);
			}
		}
	});

	app.onServer("fileCreation", function(data){
		var message = "";
		if(!data.error){
			message = data.type.capitalize() + " " + data.name + " successfully created.";
		}else{
			if(data.error.code == "EEXIST"){
				message = "A file/folder with the name " + data.name + " already exist.";
			}else{
				message = "An error occured on file creation, check console for further details.";
				console.log(data);
			}
		}
		self.fileCreationPopupContent.html(message);
		self.fileCreationPopup.show();
		self.goTo();
	});

	app.onServer('downloadFile', function(data){
		var url = location.origin + data.link;
		var popup = new Popup('Download file', 'To download <b>'+data.name+'</b> click on this link : <br><a href="'+url+'" download="'+data.name+'">'+url+'</a><br>It will work only once so you can share it safely', function(popup){
			popup.delete();
		});
		popup.show();
	});
});

/****************************************************************************************************/
/* File */
function File(data, fileApp){
	var self  = this;
  this.name = data.name;
  this.path = data.path;
  this.type = data.type;
  this.size = data.size;
  this.selected = false;
	this.fileApp = fileApp;

  this.div = $("<div>").addClass("file");
  this.iconWrap = $("<div>").addClass("iconWrap").appendTo(this.div);
  this.icon = $("<div>").addClass("icon material-icons").appendTo(this.iconWrap);
  if(this.type=="directory"){
      this.icon.addClass("folderIcon").html("folder");
  }else{
      this.icon.addClass("fileIcon").html("insert_drive_file");
  }
  this.nameDiv = $("<div>").addClass("fileName").html(this.name).appendTo(this.div);

  this.div.click(function(){
      self.select();
  });

  this.div.dblclick(function(){
      if(self.type=="directory"){
          fileApp.goTo(self.path);
      }else{
          self.open();
      }
  });

  if(this.type=="file"){
      this.downloadButton = $("<button>").addClass("flatButton iconButton fileButton material-icons").html('file_download').appendTo(this.div).click(function(){
				self.fileApp.downloadFile(self.path);
			});
      this.fileSize = $("<div>").addClass("fileSize").html(hrFileSize(this.size)).appendTo(this.div);
  }
}

File.prototype.select = function(){
    if(!this.selected){
        this.fileApp.unselectAllFiles();
        this.fileApp.selectFile(this);
        this.div.addClass("active");
        this.selected = true;
    }
}

File.prototype.unselect = function(){
    if(this.selected){
		this.fileApp.unselectFile(this);
        this.div.removeClass("active");
        this.selected = false;
    }
}

File.prototype.open = function(){
    serverUI.emit("openDocument", {path: this.path, name: this.name});
    serverUI.setApp("notepad");
}
