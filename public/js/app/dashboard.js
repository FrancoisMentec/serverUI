serverUI.app("dashboard", "dashboard", function(app){
	var that = this;
	
	app.content.addClass("withPadding");
	
	this.hostname = $("<h6>").html("hostname").appendTo(app.content);
	this.os = $("<div>").addClass("caption").html("os").appendTo(app.content);
	
	this.separator = $("<hr>").appendTo(app.content);
	
	this.uptime = new Timer(0, "UPTIME", app.content);
	
	this.memory = new ProgressBar(0, 0, "MEMORY", FILE_SIZE, false, true, app.content);
	this.diskMemory = new ProgressBar(0, 0, "DISK MEMORY", FILE_SIZE, false, true, app.content);
	

    
	//Function
	this.updateOSInformation = function(data){
		//uptime
		that.uptime.setTime(data.uptime);
		
		//memory
		var usedmem = data.totalmem-data.freemem;
		that.memory.setBoth(usedmem, data.totalmem);
		
		//diskMemory
		if(data.disk){
			var mount = [];
			var used = 0;
			var total = 0;
			for(var d in data.disk){
				if(mount.indexOf(data.disk[d].mount)==-1){
					mount.push(data.disk[d].mount);
					used += data.disk[d].used;
					total += data.disk[d].size;
				}
			}

			that.diskMemory.setAll(used*1024, total*1024, false);
		}else if(that.diskMemory.error == false){
			that.diskMemory.setError();
		}
	}
	
	// Events
	app.onServer("authentification", function(data){
		if(data.authentified){
			serverUI.emit("getOSInformation");
		}
	});
	
	app.onServer("OSInformation", function(data){
		/*console.log("Dashboard, OSInformation : ");
		console.log(data);*/
		that.hostname.html(data.hostname);
		that.os.html(data.platform + " (" + data.type + ") " + data.release + " " + data.arch);
		that.updateOSInformation(data);
	});
	
	app.onServer("updateOSInformation", function(data){
		that.updateOSInformation(data);
	});
});