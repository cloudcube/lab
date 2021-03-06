/*
Copyright 2013 Martin Schnabel. All rights reserved.
Use of this source code is governed by a BSD-style
license that can be found in the LICENSE file.
*/
define(["tile", "underscore", "zepto", "backbone"],
function(tile) {

var DocView = Backbone.View.extend({
	tagName: "section",
	className: "godoc",
	events: {
		"click .toggleButton": "toggle",
		"click a[data-href]": "toggleLink",
	},
	initialize: function(opts) {
		this.id = _.uniqueId("godoc");
		this.path = opts.path;
		this.tile = new tile.Tile({
			id:    this.id,
			uri:   "doc/"+ this.path,
			name:  this.path,
			view:  this,
			close: true,
		});
		this.hash = "";
		$.get("/doc/"+this.path, _.bind(this.onReceive, this));
	},
	onReceive: function(data) {
		var hashes = location.hash.split('#');
		data = data
			.replace(/ href="#/g, ' data-href="#')
			.replace(/ href="/g, ' href="#'+hashes[1]+'/')
			.replace(/ id="/g, ' data-id="');
		this.$el.html(data);
		var hash = this.hash;
		if (hash) {
			this.hash = "";
			this.openHash(hash);
		}
	},
	render: function() {
		return this;
	},
	toggle: function(e) {
		var el = $(e.target).closest('.toggle, .toggleVisible');
		el.toggleClass('toggle').toggleClass('toggleVisible');
	},
	toggleLink: function(e) {
		e.preventDefault();
		var href = $(e.currentTarget).attr('data-href');
		if (href.indexOf("#file/") === 0) {
			Backbone.history.navigate(href, {trigger: true});
			return;
		}
		this.openHash(href);
	},
	openHash: function(hash) {
		if (!hash) return;
		if (hash[0] == "#") hash = hash.slice(1);
		var target = $('[data-id="'+hash+'"]');
		console.log("found", target);
		if (!target.length) {
			this.hash = hash;
			return;
		}
		if (target.hasClass('toggle')) {
			target.toggleClass('toggle').toggleClass('toggleVisible');
		}
		target.get(0).scrollIntoView();
		var hashes = location.hash.split('#');
		Backbone.history.navigate('#'+hashes[1]+'#'+hash);
		this.hash = "";
	}
});

var DocRouter = function(opts) {
	this.map = {}; // path: view,
	this.route = "doc/*path";
	this.name = "opengodoc";
};
DocRouter.prototype = {
	tiles: function(path) {
		var ph = this.splithash(path);
		path = ph[0];
		var view = this.map[path];
		if (!view) {
			view = new DocView({path: path});
			this.map[path] = view;
		}
		if (ph.length > 1 && ph[1]) view.openHash(ph[1]);
		view.tile.set("active", true);
		return view.tile;
	},
	splithash: function(path) {
		var pathhash = path.split("#");
		if (pathhash.length > 0 && pathhash[0][pathhash[0].length-1] == "/") {
			pathhash[0] = pathhash[0].slice(0, pathhash[0].length-1);
		}
		return pathhash;
	}
};

return {
	View: DocView,
	router: new DocRouter(),
};
});
