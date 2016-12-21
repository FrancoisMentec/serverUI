/****************************************************************************************************/
/* App */
function App(name, icon, button, content){
	this.name = name;
	this.icon = icon;
	this.button = button;
	this.content = content;
	this.onServerEvents = new Object();
}

App.prototype.onServer = function(action, event){
	this.onServerEvents[action] = event;
}

App.prototype.triggerOnServer = function(action, data){
	if(typeof this.onServerEvents[action] != "undefined"){
		this.onServerEvents[action](data);
	}
}