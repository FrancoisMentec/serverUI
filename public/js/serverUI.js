//****************************************************************************************************
// serverUI
function ServerUI(){
	var self = this;
	this.authentified = false;
	this.leftPaneVisible = true;
	this.currentApp = false;
	this.apps = new Object();

	/* Build UI */
	this.authentificationPane = $("<div>").addClass("authentificationPane dark").appendTo("body");
	this.authentificationForm = $("<div>").addClass("authentificationForm").appendTo(this.authentificationPane);
	this.authentificationPassword = new TextField("password", this.authentificationForm, true, function(e){
		self.emit("authentification", {password: this.val()});
	}, true);

	//top bar
	this.topBar = $("<div>").addClass('main-top-bar topBar dark').appendTo("body");
	this.toggleLeftPaneButton = $('<button>').addClass('flatButton iconButton material-icons').html('arrow_back').appendTo(this.topBar).click(function(){
		self.toggleLeftPane();
	});
	this.topBar.append('serverUI');

	this.topBarLeftPane = $('<div>').addClass('topBarLeftPane').appendTo(this.topBar);
	this.logoutButton = $('<button>').addClass('flatButton iconButton material-icons').html('power_settings_new').appendTo(this.topBarLeftPane).click(function(){
		self.emit("authentification", {password: false});
	});

	//content
	this.content = $("<div>").addClass("content").appendTo("body");
	this.leftPane = $("<div>").addClass("leftPane").appendTo(this.content);
	this.appsWrap = $("<div>").addClass("appsWrap").appendTo(this.content);

	/* Connect to server */
	this.socket = io.connect();

	this.socket.on('message', function(message) {
			/*console.log("new message from server : "+message.action);
			console.log(message);*/
			switch(message.action){
				//general
				case "authentification":
					self.authentification(message.authentified);
					break;
			}

			self.triggerEvent(message);
		});

	this.socket.on('disconnect',function(){
		self.authentification(false);
		self.triggerEvent({action: "authentification", authentified: false});
	});
}

ServerUI.prototype.emit = function(action, data = new Object()){
	data.action = action;
	this.socket.emit("message", data);
}

ServerUI.prototype.authentification = function(authentified){
	if(this.authentified != authentified){
		this.authentified = authentified;
		if(this.authentified){
			this.authentificationPane.fadeOut();
		}else{
			this.authentificationPassword.val("");
			this.authentificationPane.fadeIn();
		}
	}
}

ServerUI.prototype.toggleLeftPane = function(visible){
	if(typeof visible != 'boolean'){
		visible = !this.leftPaneVisible;
	}
	this.leftPaneVisible = visible;
	if(this.leftPaneVisible){
		this.leftPane.removeClass('hidden');
		this.appsWrap.removeClass('full-width');
		this.toggleLeftPaneButton.html('arrow_back');
	}else{
		this.leftPane.addClass('hidden');
		this.appsWrap.addClass('full-width');
		this.toggleLeftPaneButton.html('menu');
	}
}

ServerUI.prototype.app = function(name, icon, Construct){
	var that = this;
	var button = $("<button>").addClass("appButton").html("<i class='material-icons'>"+icon+"</i><span>"+name.capitalize()+"</span>").click(function(){
		that.setApp(name);
	}).appendTo(this.leftPane);
	var content = $("<div>").addClass("appContent").appendTo(this.appsWrap);
	var app = new App(name, icon, button, content);
	app.prototype = new Construct(app);
	this.apps[name] = app;
	if(this.currentApp == false){
		this.setApp(name);
	}
}

ServerUI.prototype.setApp = function(name){
	var app = this.apps[name];
	if(app && this.currentApp != app){
		if(this.currentApp){
			this.currentApp.content.hide();
			this.currentApp.button.removeClass("active");
		}
		this.currentApp = app;
		this.currentApp.content.show();
		this.currentApp.button.addClass("active");
	}
}

//Trigger events of apps
ServerUI.prototype.triggerEvent = function(message){
	for(var app in this.apps){
		this.apps[app].triggerOnServer(message.action, message);
	}
}

/****************************************************************************************************/
/* instanciate serverUI */
serverUI = new ServerUI();
