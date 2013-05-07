"use strict"

/**
 * @class Generic.View
 * @extends Backbone.View
 *
 * Generic View extends Backbone.View to add functionalities or restrictions for all views:
 *
 * * Children views
 * * {@link #rendered} flag 
 * * Partitional auto-render, 1 way model-dom binding
 *
 * Rendering
 * ---------
 *
 * Deprecated: auto-render during initialization. To render view {@link #render} method should be called manually. 
 * 
 * For example:
	@example
	require(["jquery", "generic/Model", "generic/View"], function ($, Model, View) {
		var ExampleView = View.extend({
			template: "<h1>Example</h1><p>This is result of rendering example view</p>"
		});
		var view = new ExampleView({
			model: new Model()
		});
		view.render();
		$("body").append(view.el);
	});
*
 * DOM Element
 * -----------
 *
 * View makes dom element by itself. All dom elements encapsulated inside view, and should not be accessable outside.
 * 
 * Wrong way:
 * 		@example
 * 		var view = new View({
 * 			el: $(".selector")
 * 		});
 *
 * Right way:
 * 		@example
 *   	var view = new View();
 *    	$(".container").append(view.el);
 *
 * 
 * Model binding
 * -------------
 *
 * TBD
 *
 * Children views
 * --------------
 *
 * TBD
 * 
 */
define([
	"jquery",
	"underscore",
	"backbone"
], function (
	$,
	_,
	Backbone
) {

	var View = Backbone.View.extend({

		/**
		 * @event add
		 * Fired when new child view is added
		 * @param {Generic.View} childView instance of added child view
		 */
		
		/**
		 * @event remove
		 * Fired when child view is removed
		 * @param {Generic.View} childView instance of added child view
		 */
		
		/**
		 * @event destroy
		 * Fired when the view is destroyed
		 * @param {Generic.View} instance of the view
		 */

		/**
		 * Children views
		 * @type {Array}
		 * @protected
		 */
		children: undefined,

		/**
		 * Indicate if view is rendered
		 * @type {Boolean}
		 * @readonly
		 */
		rendered: false,

		// experimental support for fragment rendering
		_ensureElement: function () {
			if (this.el === "fragment" || this.tagName == null) {
				this.el = document.createDocumentFragment();
			}
			Backbone.View.prototype._ensureElement.apply(this, arguments);
		},

		/**
		 * Override backbone initialize method
		 * Add logic to initialize with model
		 * @param  {Object} options options passed to the view
		 * @protected
		 */
		initialize: function (options) {
			var self = this;
			Backbone.View.prototype.initialize.apply(self, arguments);
			if (self.model) {
				self.bindModel(self.model);
			}
		},

		/**
		 * Bind model to the View
		 * @param {Generic.View} model
		 */
		bindModel: function (model) {
			this.model = model;
			model.on("destroy", this.destroy, this);
			model.on("change", this.onModelChange, this);
		},

		onModelChange: function (model) {
			var self = this;
			_(model.changed).each(function (value, property) {
				self.$("[data-bind=" + property +"]").text(value);
			});
		},

		// TODO: open/close ? 

		/**
		 * Rename Backbone.View method "remove" to destroy
		 * @param  {Generic.View} view subview
		 */
		destroy: function () {
			Backbone.View.prototype.remove.apply(this, arguments);
			this.destroyed = true;
			if (this.model) {
				this.model.off("close", this);
			}
			if (this.children) {
				_(this.children).each(function (view) {
					view.destroy();
				});
			}
			this.trigger("destroy", this);
		},

		/**
		 * Add new subview to the view. 
		 * It's only used to store all children views in one place and susbscribe to thier events. 
		 * It doesn't render or place child view into DOM. It should be done manually.
		 *
		 * @param {String} {optional} child view identificator
		 * @param {Generic.View} view
		 */
		add: function (childId, childView) {
			if (_.isObject(childId)) {
				childView = childId;
				childId = childView.id || childView.cid;
			}
			if (!this.children) {
				this.children = []; // Initialize empty array for children view
				this.childrenMap = {}; // children map used to find view's by id or cid
			}
			this.children.push(childView);
			this.childrenMap[childId] = this.children.length - 1;
			childView.on("destroy", self.onChildViewDestroyed, self);
			this.trigger("add", childView);
			return childView;
		},

		/**
		 * Return child view by id or cid
		 * @param  {String} childId child view's id
		 * @return {Backbone.View}
		 */
		get: function (childId) {
			if (!this.childrenMap) {
				return undefined;
			}
			var idx = this.childrenMap[childId];
			return this.children[idx];
		},

		/**
		 * Override remove method of View to be consistence with add method
		 * @param  {Generic.View} view sub view to remove
		 * @return {Generic.View}
		 */
		remove: function (childView) {
			this.children = _(this.children).reject(function (view) {
				return view.cid === childView.cid;
			});
			this.trigger("remove", childView);
		},

		/**
		 * Called when child view is destroyed
		 * @param  {Generic.View} childView
		 * @protected
		 */
		onChildViewDestroyed: function (childView) {
			var self = this;
			self.children = _(self.children).reject(function (view) {
				return view.cid === childView.cid;
			});
		},

		/**
		 * Return template's context, which will be passed to template render function
		 * For backward copability with old generic this method returns model's json, but it will be depricated in future
		 * 
		 * @protected
		 * @return {Object}
		 */
		getTemplateContext: function () {
			return this.model ? this.model.toJSON() : {};
		},

		/**
		 * Override Backbone.View method to provide rendered property
		 * @return this
		 */
		render: function () {
			Backbone.View.prototype.render.apply(this, arguments);
			this.rendered = true;
			if (this.template) {
				this.$el.html(_.template(this.template, this.getTemplateContext()));
			}
			return this;
		}
	});

	return View;
});