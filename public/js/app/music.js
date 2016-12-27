serverUI.app("music", "music_note", function(app){
	var that = this;
	var self = this;
	this.musics = [];
	this.artistsName = [];
	this.artists = {};
	this.albumsName = [];
	this.albums = {};
	this.playlist = [];
	this.index = -1;
	this.mode = "loop_all"; //normal, loop_all, loop_one, random
	this.modeIcon = {"normal": "arrow_forward", "loop_all": "repeat", "loop_one": "repeat_one", "random": "shuffle"};
	this.wasPlaying = false;
	this.draggTime = false;
	this.draggVolume = false;

  this.mainWrap = $("<div>").addClass("music-main-wrap").appendTo(app.content);

	//playlist
  this.playlistPane = $("<div>").addClass("music-playlist-pane").appendTo(this.mainWrap);
	this.playlistTopBar = $("<div>").addClass("music-playlist-top-bar").html("Playlist").appendTo(this.playlistPane);
	this.clearPlaylistButton = $('<button>').addClass('flatButton iconButton material-icons').html('clear').appendTo(this.playlistTopBar).click(function(){
		that.clearPlaylist();
	});
	this.playlistContent = $("<div>").addClass("music-playlist-content").appendTo(this.playlistPane);

	//library
  this.libraryWrap = $("<div>").addClass("music-library-wrap").appendTo(this.mainWrap);
	this.libraryTabs = new Tabs(this.libraryWrap);

	//libray artist
	this.libraryArtist = $("<div>").addClass("music-library");
	this.libraryArtistSearch = $("<input>").addClass("music-library-search").attr("placeholder", "Search an artist").appendTo(this.libraryArtist).keyup(function(){
		var regexp = new RegExp(that.libraryArtistSearch.val(), 'i');
		for(var a in that.artists){
			var artist = that.artists[a];
			artist.setVisible(artist.name.match(regexp)!=null);
		}
	});
	this.libraryArtistContent = $("<div>").addClass("music-library-content").appendTo(this.libraryArtist).scroll(function(){
		if(that.libraryArtistContent.scrollTop()>0){
			that.libraryArtist.addClass("scrolled");
		}else{
			that.libraryArtist.removeClass("scrolled");
		}
	});
	this.libraryTabs.addTab(new Tab("Artist", this.libraryArtist));

	//libray album
	this.libraryAlbum = $("<div>").addClass("music-library");
	this.libraryAlbumSearch = $("<input>").addClass("music-library-search").attr("placeholder", "Search an album").appendTo(this.libraryAlbum).keyup(function(){
		var regexp = new RegExp(that.libraryAlbumSearch.val(), 'i');
		for(var a in that.albums){
			var album = that.albums[a];
			album.setVisible(album.name.match(regexp)!=null);
		}
	});
	this.libraryAlbumContent = $("<div>").addClass("music-library-content").appendTo(this.libraryAlbum).scroll(function(){
		if(that.libraryAlbumContent.scrollTop()>0){
			that.libraryAlbum.addClass("scrolled");
		}else{
			that.libraryAlbum.removeClass("scrolled");
		}
	});
	this.libraryTabs.addTab(new Tab("Album", this.libraryAlbum));

	//library music
	this.libraryMusic = $("<div>").addClass("music-library");
	this.libraryMusicSearch = $("<input>").addClass("music-library-search").attr("placeholder", "Search a music").appendTo(this.libraryMusic).keyup(function(){
		var regexp = new RegExp(that.libraryMusicSearch.val(), 'i');
		for(var m in that.musics){
			var music = that.musics[m];
			music.setVisible(music.title.match(regexp)!=null);
		}
	});
	this.libraryMusicContent = $("<div>").addClass("music-library-content").appendTo(this.libraryMusic).scroll(function(){
		if(that.libraryMusicContent.scrollTop()>0){
			that.libraryMusic.addClass("scrolled");
		}else{
			that.libraryMusic.removeClass("scrolled");
		}
	});
	this.libraryTabs.addTab(new Tab("Music", this.libraryMusic));

	this.libraryPlaylist = $("<div>").html("Coming soon");
	this.libraryTabs.addTab(new Tab("Playlist", this.libraryPlaylist));

	//controlpane
  this.controlPane = $("<div>").addClass("music-control-pane").appendTo(app.content);
	this.controlPaneCover = $("<img>").attr("src", "/image/defaultCover.png").addClass("music-control-pane-cover").appendTo(this.controlPane);
	this.controlPaneRight = $("<div>").addClass("music-control-pane-right").appendTo(this.controlPane);
	this.musicProgressBar = $("<div>").addClass("music-control-progress-bar").appendTo(this.controlPaneRight);
	this.musicProgressBarCurrent = $("<div>").addClass("music-control-progress-bar-current").appendTo(this.musicProgressBar);
	this.currentMusicTitle = $("<div>").addClass("music-control-music-title").appendTo(this.controlPaneRight);
	this.currentMusicArtist = $("<div>").addClass("music-control-music-artist").appendTo(this.controlPaneRight);
	this.buttonsWrap = $("<div>").addClass("music-control-buttons-wrap").appendTo(this.controlPaneRight);
	this.volumeButton = $("<button>").addClass("flatButton iconButton music-control-volume-button").appendTo(this.buttonsWrap);
	this.volumeIcon = $("<i>").addClass("material-icons").html("volume_up").appendTo(this.volumeButton);
	this.volumeBarWrap = $("<div>").addClass("music-control-volume-bar-wrap").appendTo(this.volumeButton);
	this.volumeBar = $("<div>").addClass("music-control-volume-bar").appendTo(this.volumeBarWrap);
	this.volumeBarCurrent = $("<div>").addClass("music-control-volume-bar-current").appendTo(this.volumeBar);
	this.previousButton = $("<button>").addClass("flatButton iconButton material-icons").html("skip_previous").appendTo(this.buttonsWrap).click(function(){
		that.previous();
	});
	this.playButton = $("<button>").addClass("flatButton iconButton material-icons").html("play_arrow").appendTo(this.buttonsWrap).click(function(){
		if(that.audio.prop("paused")){
			that.audio.trigger("play");
		}else{
			that.audio.trigger("pause");
		}
	});
	this.nextButton = $("<button>").addClass("flatButton iconButton material-icons").html("skip_next").appendTo(this.buttonsWrap).click(function(){
		that.next();
	});
	this.modeButton = $("<button>").addClass("flatButton iconButton material-icons").html(this.modeIcon[this.mode]).appendTo(this.buttonsWrap).click(function(){
		if(that.mode=="normal"){
			that.mode = "loop_all";
		}else if(that.mode=="loop_all"){
			that.mode = "loop_one";
		}else if(that.mode=="loop_one"){
			that.mode = "random";
		}else if(that.mode=="random"){
			that.mode = "normal";
		}
		that.modeButton.html(that.modeIcon[that.mode]);
	});
	this.shareButton = $("<button>").addClass("flatButton iconButton material-icons").html("share").appendTo(this.buttonsWrap).click(function(){
		if(that.index>-1){
			var url = location.origin+"/music/"+that.playlist[that.index].id;
			var popup = new Popup("Share", "<a target='_blank' href='"+url+"'>"+url+"</a>", function(popup){
				popup.delete();
			});
			popup.show();
		}
	});

	//dragg time and volume
	this.musicProgressBar.mousedown(function(event){
		$("body").addClass("no-select");
		that.wasPlaying = !that.audio.prop("paused");
		that.audio.trigger("pause");
		that.draggTime = true;
		var time = (event.pageX - that.musicProgressBar.offset().left)/that.musicProgressBar.width()*that.audio.prop("duration");
		if(time<0){
			time = 0;
		}
		that.audio.prop("currentTime", time);
		that.updateProgressBar();
	});

	this.volumeBarWrap.mousedown(function(event){
		$("body").addClass("no-select");
		that.draggVolume = true;
		var volume = (event.pageX - that.volumeBar.offset().left)/that.volumeBar.width();
		if(volume<0){
			volume = 0;
		}else if(volume>1){
			volume = 1;
		}
		that.audio.prop("volume", volume);
		that.updateVolumeBar();
	});

	$(document).mouseup(function(){
		if(that.draggTime){
			$("body").removeClass("no-select");
			that.draggTime = false;
			if(that.wasPlaying){
				that.audio.trigger("play");
			}
		}
		if(that.draggVolume){
			$("body").removeClass("no-select");
			that.draggVolume = false;
		}
	});

	$(document).mousemove(function(event){
		if(that.draggTime){
			var time = (event.pageX - that.musicProgressBar.offset().left)/that.musicProgressBar.width()*that.audio.prop("duration");
			if(time<0){
				time = 0;
			}
			that.audio.prop("currentTime", time);
			that.updateProgressBar();
		}
		if(that.draggVolume){
			var volume = (event.pageX - that.volumeBar.offset().left)/that.volumeBar.width();
			if(volume<0){
				volume = 0;
			}else if(volume>1){
				volume = 1;
			}
			that.audio.prop("volume", volume);
			that.updateVolumeBar();
		}
	});

	//audio tag
	this.audio = $("<audio controls>").addClass("music-player").appendTo(this.controlPaneRight);
	this.audio.bind("play", function(){
		that.playButton.html("pause");
	});
	this.audio.bind("pause", function(){
		that.playButton.html("play_arrow");
	});
	this.audio.bind("timeupdate", function(){
		that.updateProgressBar();
	});
	this.audio.bind("ended", function(){
		that.next(false);
	});
	this.audio.bind("volumechange", function(){
		var volume = that.audio.prop("volume");
		if(volume==0){
			that.volumeIcon.html("volume_mute");
		}else if(volume>0.5){
			that.volumeIcon.html("volume_up");
		}else if(volume<=0.5){
			that.volumeIcon.html("volume_down");
		}
		that.updateVolumeBar();
	});

	//functions
	this.updateProgressBar = function(){
		this.musicProgressBarCurrent.css("width", (this.audio.prop("currentTime")/this.audio.prop("duration")*100)+"%");
	}

	this.updateVolumeBar = function(){
		this.volumeBarCurrent.css("width", (this.audio.prop("volume")*100)+"%");
	}

	this.updateLibraryView = function(){
		//Artist library
		this.artistsName.sort(notCaseSensitiveSorting);
		this.libraryArtistContent.empty();
		for(var a in this.artistsName){
			this.libraryArtistContent.append(this.artists[this.artistsName[a]].div);
		}

		//Album library
		this.albumsName.sort(notCaseSensitiveSorting);
		this.libraryAlbumContent.empty();
		for(var a in this.albumsName){
			this.libraryAlbumContent.append(this.albums[this.albumsName[a]].div);
		}

		//Music library
		this.musics.sort(function(a, b){
			return notCaseSensitiveSorting(a.title, b.title);
		});
		this.libraryMusicContent.empty();
		for(var m in this.musics){
			this.libraryMusicContent.append(this.musics[m].musicDiv.div);
		}
	}

	//Add a music to the current playlist
	this.addToPlaylist = function(music){
		var index = -1;
		for(var m in this.playlist){
			if(this.playlist[m]==music){
				index = m;
				break;
			}
		}

		if(index!=-1){
			this.play(parseInt(index, 10));
		}else{
			this.playlist.push(music);
			this.playlistContent.append(music.playlistDiv);
			if(this.index==-1){
				this.play(0);
			}
		}
	}

	//Remove all playlist form current playlist
	this.clearPlaylist = function(){
		this.play(null);
		for(var m in this.playlist){
			this.playlist[m].removeFromPlaylist();
		}
		this.playlist = [];
	}

	this.play = function(val){
		if(this.index!=-1){
			this.playlist[this.index].setPlaying(false);
		}

		if(val==null){
			this.index = -1;
			this.audio.trigger('pause');
			this.audio.attr("src", '');
			this.musicProgressBarCurrent.css('width', '0');
			this.currentMusicTitle.empty();
			this.currentMusicArtist.empty();
			this.controlPaneCover.attr("src",'/image/defaultCover.png');
			return
		}

		//find music to play
		if(typeof val == "number"){
			this.index = val;
		}else if(typeof val == "object"){
			for(var i=0; i<this.playlist.length; i++){
				if(this.playlist[i]==val){
					this.index = i;
					break;
				}
			}
		}
		var music = this.playlist[this.index];
		music.setPlaying(true);

		this.audio.attr("src", "/music/"+music.id);
		this.audio.trigger("play");

		this.controlPaneCover.attr("src", music.cover);
		this.currentMusicTitle.html(music.title);
		this.currentMusicArtist.html(music.artist+' - '+music.album);
	}

	this.next = function(manual=true){
		if(this.playlist.length>0){
			if(this.mode=="normal"){
				if(this.index<this.playlist.length-1){
					this.play(this.index+1);
				}else if(manual){
					this.play(0);
				}
			}else if(this.mode=="loop_all"){
				if(this.index<this.playlist.length-1){
					this.play(this.index+1);
				}else{
					this.play(0);
				}
			}else if(this.mode=="loop_one"){
				if(manual){
					if(this.index<this.playlist.length-1){
						this.play(this.index+1);
					}else{
						this.play(0);
					}
				}else{
					this.play();
				}
			}else if(this.mode=="random"){
				var n = this.index;
				while(this.playlist.length>1 && n==this.index){
					n = Math.floor(Math.random()*this.playlist.length);
				}
				this.play(n);
			}
		}
	}

	this.previous = function(){
		if(this.playlist.length>0){
			if(this.index>0){
				this.play(this.index-1);
			}else{
				this.play(this.playlist.length-1);
			}
		}
	}

	//Events
	app.onServer("authentification", function(data){
		if(data.authentified){
			serverUI.emit("getMusics");
		}else{
			self.audio.trigger('pause');
		}
	});

	app.onServer("setMusics", function(data){
		that.musics = [];
		that.artists = {};
		that.artistsName = [];
		that.albums = {};
		that.albumsName = [];
		for(var m in data.musics){
			var music = new Music(data.musics[m], that);
			that.musics.push(music);
			//add to artist
			if(typeof that.artists[music.artist] == "undefined"){
				that.artists[music.artist] = new Playlist(music.artist);
				that.artistsName.push(music.artist);
			}
			that.artists[music.artist].addMusic(music);
			//add to album
			if(typeof that.albums[music.album] == "undefined"){
				that.albums[music.album] = new Playlist(music.album);
				that.albumsName.push(music.album);
			}
			that.albums[music.album].addMusic(music);
		}

		that.updateLibraryView();
	});
});

//Playlist (for artist, album, and playlist)
function Playlist(name){
	var that = this;
	this.name = name;
	this.musics = [];
	this.expanded = false;

	this.div = $("<div>").addClass("playlist");
	this.nameDiv = $("<div>").addClass("playlist-name").text(this.name).appendTo(this.div).click(function(){
		that.toggle();
	});
	this.musicsDiv = $("<div>").addClass("playlist-musics").appendTo(this.div);
	this.playAllButton = $("<div>").addClass("music").html("Play all musics").appendTo(this.musicsDiv).click(function(){
		that.playAll();
	});
}

Playlist.prototype.toggle = function(){
	this.expanded = !this.expanded;
	if(this.expanded){
		this.div.addClass("expanded");
	}else{
		this.div.removeClass("expanded");
	}
}

Playlist.prototype.setVisible = function(visible){
	if(visible){
		this.div.show();
	}else{
		this.div.hide();
	}
}

Playlist.prototype.addMusic = function(music){
	this.musics.push(music);
	this.musicsDiv.append(music.div());
}

Playlist.prototype.playAll = function(){
	for(var m in this.musics){
		this.musics[m].addToPlaylist();
	}
}

//Music
function Music(data, musicApp){
	var that = this;
	this.musicApp = musicApp;
	this.id = data.id;
	this.title = data.title;
	this.artist = data.artist;
	this.album = data.album;
	this.cover = "/music/cover/"+this.id;
	this.duration = data.duration;
	this.genre = data.genre;
	this.year = data.year;
	this.divs = [];

	this.musicDiv = new MusicDiv(this);
	this.divs.push(this.musicDiv);

	this.playlistDiv = $("<div>").addClass("music").text(this.title).click(function(){
		that.musicApp.play(that);
	});
}

Music.prototype.div = function(){
	var div = new MusicDiv(this);
	this.divs.push(div);
	return div.div;
}

Music.prototype.addToPlaylist = function(){
	for(var d in this.divs){
		this.divs[d].icon = 'playlist_add_check';
	}
	this.musicApp.addToPlaylist(this);
}

Music.prototype.removeFromPlaylist = function(){
	this.playlistDiv.detach();
	for(var d in this.divs){
		this.divs[d].icon = 'playlist_add';
	}
}

Music.prototype.setVisible = function(visible){
	if(visible){
		this.musicDiv.show();
	}else{
		this.musicDiv.hide();
	}
}

Music.prototype.setPlaying = function(playing){
	if(playing){
		this.playlistDiv.addClass("active");
		for(var d in this.divs){
			this.divs[d].icon = 'playlist_play';
		}
	}else{
		this.playlistDiv.removeClass("active");
		for(var d in this.divs){
			this.divs[d].icon = 'playlist_add_check';
		}
	}
}

//Music div
function MusicDiv(music){
	var self = this;
	this.music = music;
	this.div = $('<div>').addClass('music').click(function(){
		self.music.addToPlaylist();
	});
	this._icon = $('<span>').addClass('material-icons').html('playlist_add').appendTo(this.div);
	this.title = $('<span>').text(this.music.title).appendTo(this.div);
}

Object.defineProperty(MusicDiv.prototype, 'icon', {
	set: function(icon){
		this._icon.html(icon);
	}
});

MusicDiv.prototype.show = function(){
	this.div.show();
}

MusicDiv.prototype.hide = function(){
	this.div.hide();
}
