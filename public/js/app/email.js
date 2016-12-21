serverUI.app("email", "email", function(app){
	var that = this;

  this.from = new TextField("From", app.content);
  this.to = new TextField("To", app.content);
  this.object = new TextField("Object", app.content);
  this.content = new TextField("Content", app.content);
});
