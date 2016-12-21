/****************************************************************************************************/
/* TextField */
function TextField(name, parent, password = false, onEnter = false, autofocus = false, condensed = false, fullWidth = false){
	var that = this;
	this.name = name;
	this.onEnterEvent = onEnter;

	this.div = $("<div>").addClass("textField");
	if(condensed){
		this.div.addClass("condensed");
	}
	if(fullWidth){
		this.div.addClass("fullWidth");
	}
	this.label = $("<label>").html(this.name).appendTo(this.div);
	this.input = $("<input>").appendTo(this.div);
	if(password){
		this.input.attr("type", "password");
	}

	this.input.focusin(function(){
		that.div.addClass("active");
	});

	this.input.focusout(function(){
		that.div.removeClass("active");
	});

	this.input.change(function(){
		if(that.input.val().length>0){
			that.div.addClass("notEmpty");
		}else{
			that.div.removeClass("notEmpty");
		}
	});

	this.input.keyup(function(e){
		if(e.keyCode==13 && that.onEnterEvent){
			that.onEnterEvent(e);
		}
	});

	this.div.appendTo(parent);

	if(autofocus){
		this.input.focus();
	}
}

TextField.prototype.val = function(val){
	if(typeof val != "undefined"){
		var res = this.input.val(val);
		if(this.input.val().length>0){
			this.div.addClass("notEmpty");
		}else{
			this.div.removeClass("notEmpty");
		}
		return res;
	}else{
		return this.input.val();
	}
}

TextField.prototype.change = function(handler){
	return this.input.change(handler);
}

TextField.prototype.keyup = function(handler){
	return this.input.keyup(handler);
}

TextField.prototype.focus = function(){
	return this.input.focus();
}

/****************************************************************************************************/
/* RadioButton */
function RadioButton(name, value, label, parent = false, checked = false){
	this.name = name;
	this.value = value;
	this.label = label;
	this.checked = "";
	if(checked){
		this.checked = "checked";
	}
	this.div = $("<span>").addClass("radioButton");
	this.input = $("<input type='radio' name='"+this.name+"' value='"+this.value+"' "+this.checked+">").appendTo(this.div);
	this.labelDiv = $("<label>").html(this.label).appendTo(this.div);

	if(parent){
		this.div.appendTo(parent);
	}
}


/****************************************************************************************************/
/* ProgressBar */
var PERCENT = 0;
var FILE_SIZE = 1;

function ProgressBar(current, max, title, type = PERCENT, error = false, indeterminate = false, parent = false){
    this.current = current;
    this.max = max;
    this.title = title;
    this.type = type;

    this.div = $("<div>").addClass("progressBarWrap");

    this.leftDiv = $("<div>").addClass("progressBarLeft");
    this.div.append(this.leftDiv);

    this.titleDiv = $("<div>").addClass("progressBarTitle");
    this.div.append(this.titleDiv);
    if(this.title){
        this.titleDiv.html(this.title);
    }

    this.rightDiv = $("<div>").addClass("progressBarRight");
    this.div.append(this.rightDiv);

    this.progressBar = $("<div>").addClass("progressBar");
    this.div.append(this.progressBar);
    this.progressBarFill = $("<div>").addClass("progressBarFill");
    this.progressBar.append(this.progressBarFill);

	this.setError(error);
	this.setIndeterminate(indeterminate);

    this.refresh();

	if(parent){
		this.div.appendTo(parent);
	}
}

ProgressBar.prototype.refresh = function(){
	var p = this.current/this.max*100;
	this.progressBarFill.animate({width: p+"%"}, 200);

	if(this.type==PERCENT){
		if(!this.indeterminate){
			this.leftDiv.html(Math.round(p)+"%");
			this.rightDiv.html("100%");
		}else{
			this.leftDiv.empty();
			this.rightDiv.empty();
		}
	}else if(this.type==FILE_SIZE){
		if(!this.indeterminate){
			this.leftDiv.html(hrFileSize(this.current));
			this.rightDiv.html(hrFileSize(this.max));
		}else{
			this.leftDiv.html(hrFileSize(this.current));
			this.rightDiv.empty();
		}
	}
}

ProgressBar.prototype.setCurrent = function(current, refresh = true){
    this.current = current;
    if(this.current>this.max){
        this.current = this.max;
    }

	if(refresh){
		this.refresh();
	}
}

ProgressBar.prototype.setMax = function(max, refresh = true){
    this.max = max;
    if(this.current>this.max){
        this.current = this.max;
    }

	this.setIndeterminate(false); //Max is set so can't be indeterminate

    if(refresh){
		this.refresh();
	}
}

ProgressBar.prototype.setBoth = function(current, max, refresh = true){
	this.current = current;
	this.max = max;
    if(this.current>this.max){
        this.current = this.max;
    }

	this.setIndeterminate(false); //Max is set so can't be indeterminate

	if(refresh){
		this.refresh();
	}
}

ProgressBar.prototype.setError = function(error = true){
    this.error = error;

    if(error){
		this.div.addClass("error");
	}else{
		this.div.removeClass("error");
	}
}

ProgressBar.prototype.setIndeterminate = function(indeterminate = true){
    this.indeterminate = indeterminate;

    if(indeterminate){
		this.div.addClass("indeterminate");
	}else{
		this.div.removeClass("indeterminate");
	}

	this.refresh();
}

ProgressBar.prototype.setAll = function(current, max, error, refresh = true){
	this.setBoth(current, max, false);
	this.setError(error);

	if(refresh){
		this.refresh();
	}
}

/****************************************************************************************************/
/* Timer */
function Timer(time, name = false, parent = false){
	this.name = name;
    this.div = $("<div>").addClass("timer");
    this.setTime(time); // time = total time in sec

	if(parent){
		this.div.appendTo(parent);
	}
}

Timer.prototype.refresh = function(){
    var str = "";

	if(this.name){
		str += this.name + " : ";
	}

    if(this.day>0){
        str += this.day;
        if(this.day==1){
            str += " day, ";
        }else{
            str += " days, ";
        }
    }

    if(this.hour<10){
        str += "0";
    }
    str += this.hour;

    str += ":";

    if(this.min<10){
        str += "0";
    }
    str += this.min;

    str += ":";

    if(this.sec<10){
        str += "0";
    }
    str += this.sec;

    this.div.html(str);
}

Timer.prototype.setTime = function(time){
	time = Math.round(time);
    this.time = time;
    this.sec = time%60;
    time = (time-this.sec)/60;
    this.min = time%60;
    time = (time-this.min)/60;
    this.hour = time%24;
    time = (time-this.hour)/24;
    this.day = time;

    this.refresh();
}

/****************************************************************************************************/
/* Popup */
function Popup(title, content, ok = true, cancel = false){
    var that = this;
    this.title = title;
    this.content = content;
    this.visible = false;
		this.ok = ok;
    this.cancel = cancel;

    this.wrap = $("<div>").addClass("popupWrap");
    $("body").append(this.wrap);

    this.popup = $("<div>").addClass("popup");
    this.wrap.append(this.popup);

    if(this.title){
        this.titleDiv = $("<div>").addClass("popupTitle").html(this.title);
        this.popup.append(this.titleDiv);
    }

    this.contentDiv = $("<div>").addClass("popupContent").html(this.content);
    this.popup.append(this.contentDiv);

    this.actionDiv = $("<div>").addClass("popupAction");
    this.popup.append(this.actionDiv);

	if(this.cancel){
		this.cancelButton = $("<button>").addClass("flatButton colored").html("CANCEL").click(function(){
			if(typeof that.cancel == "boolean"){
				that.hide();
			}else{
				that.cancel(that);
			}
		}).appendTo(this.actionDiv);
	}

	if(this.ok){
		this.okButton = $("<button>").addClass("flatButton colored").html("OK").click(function(){
			if(typeof that.ok == "boolean"){
				that.hide();
			}else{
				that.ok(that);
			}
		}).appendTo(this.actionDiv);
	}
}

Popup.prototype.show = function(){
    if(!this.visible){
        this.wrap.fadeIn(200);
        this.popup.animate({ top : "50%" }, 400).delay(100);
        this.visible = true;
    }
}

Popup.prototype.hide = function(){
    if(this.visible){
        this.popup.animate({ top : "150%" }, 400);
        this.wrap.fadeOut(200).delay(100);
        this.visible = false;
    }
}

Popup.prototype.delete = function(){
    var that = this;
    if(this.visible){
        this.hide();
        setTimeout(function(){
            that.wrap.remove();
        }, 400);
    }else{
        that.wrap.remove();
    }
}

/****************************************************************************************************/
/* Tabs */
//tab
function Tab(title, content, closable = false, obj = false){
	var that = this;
    this.title = title;
	this.closable = closable;
    this.obj = obj;
	this.tabs = false;
    this.button = $("<div>").addClass("tabButton").html(this.title);
	if(this.closable){
		this.closeButton = $("<button>").addClass("flatButton material-icons iconButton").html("close").click(function(){ that.close(); }).appendTo(this.button);
	}
    this.content = $("<div>").addClass("tab").html(content);
}

Tab.prototype.show = function(){
    this.button.addClass("active");
    this.content.show();
}

Tab.prototype.hide = function(){
  this.button.removeClass("active");
  this.content.hide();
}

Tab.prototype.close = function(){
  if(typeof this.closable == "boolean" && this.tabs){
		this.tabs.closeTab(this);
	}else{
		this.closable(this);
	}
}

//tabs
function Tabs(parent = false){
	  this.tabs = [];
	  this.activeTab = false;

		this.div = $("<div>").addClass("tabs");
	  this.tabBar = $("<div>").addClass("tabBar dark").appendTo(this.div);
	  this.content = $("<div>").addClass("tabContent").appendTo(this.div);

		if(parent){
			this.div.appendTo(parent);
		}
}

Tabs.prototype.addTab = function(tab, setAsActive = false){
		var that = this;
		tab.button.click(function(){
		    that.setActiveTab(tab);
		});
		this.tabBar.append(tab.button);
		this.content.append(tab.content);
		tab.tabs = this;
		this.tabs.push(tab);

		if(!this.activeTab || setAsActive){
		    this.setActiveTab(tab);
		}
}

Tabs.prototype.closeTab = function(tab){
	if(this.activeTab = tab){
		var i = this.tabs.indexOf(tab);
		if(i>0){
			i--;
		}else{
			i++;
		}
		if(typeof this.tabs[i] != "undefined"){
			this.setActiveTab(this.tabs[i]);
		}
	}

	tab.button.remove();
    tab.content.remove();
	tab.tabs = false;
    this.tabs.splice(this.tabs.indexOf(tab), 1);
}

Tabs.prototype.setActiveTab = function(activeTab){
    if(this.activeTab!=activeTab){
        if(this.activeTab){
            this.activeTab.hide();
        }
        this.activeTab = activeTab;
        this.activeTab.show();
    }
}
