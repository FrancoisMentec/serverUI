serverUI.app("notepad", "edit", function(app){
	var that = this;
	this.documents = [];
	
	// ui
	this.topBar = $("<div>").addClass("subTopBar dark").appendTo(app.content);
	this.saveButton = $("<button>").addClass("flatButton material-icons iconButton").html("save").click(function(){ that.saveDocument(); }).appendTo(this.topBar);
	
	this.tabsContent = $("<div>").addClass("content").appendTo(app.content);
	
	this.tabs = new Tabs(this.tabsContent);
	
	
	// popupError
	this.popupErrorContent = $("<div>").html("Error");
	this.popupError = new Popup("Error", this.popupErrorContent);
	
	//Function
	this.saveDocument = function(){
		var doc = false;
		if(that.tabs.activeTab){
			doc = that.tabs.activeTab.obj
		}
		if(doc){
			doc.save();
		}
	}
	
	this.removeDocument = function(doc){
		that.documents.splice(that.documents.indexOf(doc), 1);
	}
	
	// Events
	app.onServer("openDocument", function(data){
		if(data.error){
			that.popupErrorContent.html("Failed to open "+data.path+" check console for further details.");
			that.popupError.show();
			console.log(data);
		}else{
			var alreadyOpen = false;
			for(var d in that.documents){
				if(that.documents[d].path == data.path){
					alreadyOpen = that.documents[d];
					break;
				}
			}
			if(!alreadyOpen){
				var doc = new Document(data.path, data.name, data.content, that);
				that.documents.push(doc);
				that.tabs.addTab(doc.tab, true);
			}else{
				if(alreadyOpen.getContent() != data.content){
					var popup = new Popup("File already opened", data.name+" is already open, if you continue current content will be lost.", function(popup){
						alreadyOpen.setContent(data.content);
						popup.delete();
					}, function(popup){
						popup.delete();
					});
					popup.show();
				}else{
					that.tabs.setActiveTab(alreadyOpen.tab);
				}
			}
		}
	});
	
	app.onServer("saveDocument", function(data){
		if(data.error){
			that.popupErrorContent.html("Failed to save "+data.path+" check console for further details.");
			that.popupError.show();
			console.log(data);
		}else{
			for(var d in that.documents){
				if(that.documents[d].path == data.path){
					that.documents[d].saved();
					break;
				}
			}
		}
	});
});

/****************************************************************************************************/
/* Document */
function Document(path, name, content, app){
	var that = this;
	this.path = path;
	this.name = name;
	this.savedContent = content;
    this.contentToSave = content;
	this.app = app;
	this.div = $("<div>").addClass("editor");
	this.tab = new Tab(this.name, this.div, function(){ that.close(); }, this);
	
	this.editor = ace.edit(this.div[0]);
	this.editor.$blockScrolling = Infinity; //disable an anoying error message
	this.editor.setTheme("ace/theme/crimson_editor");
    this.editor.getSession().setMode("ace/mode/javascript");
	this.editor.setValue(content, -1);
	this.editor.on("change", function(){
        that.checkState();
    });
}

Document.prototype.setContent = function(content){
	this.savedContent = content;
    this.contentToSave = content;
	this.editor.setValue(content, -1);
}

Document.prototype.getContent = function(){
	return this.editor.getValue();
}

Document.prototype.save = function(){
    this.contentToSave = this.editor.getValue();
    if(this.contentToSave!=this.savedContent){
		serverUI.emit("saveDocument", {path: this.path, name: this.name, content: this.contentToSave});
    }
}

Document.prototype.saved = function(){
    this.savedContent = this.contentToSave;
    this.checkState();
}

Document.prototype.checkState = function(){
    if(this.editor.getValue() == this.savedContent){
        this.tab.button.removeClass("notSaved");
    }else{
        this.tab.button.addClass("notSaved");
    }
}

Document.prototype.close = function(){
	var that = this;
    if(this.savedContent == this.getContent()){
		this.tab.tabs.closeTab(this.tab); //close the tab
		this.app.removeDocument(this); //remove from the list of documents
	}else{
		var popup = new Popup("Close "+this.name, "Current content isn't saved and will be lost", function(popup){
			that.tab.tabs.closeTab(that.tab); //close the tab
			that.app.removeDocument(that); //remove from the list of documents
			popup.delete();
		}, function(popup){ popup.delete(); });
		popup.show();
	}
}