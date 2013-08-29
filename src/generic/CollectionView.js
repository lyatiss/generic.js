/**
 * @class  Generic.CollectionView
 * @extends Generic.View
 * 
 * CollectionView subscribes to collection events, and add/remove child views.
 * CollectionView will render child item automaticaly and append to the collection dom elemenet. 
 * But only after CollectionView.render was rendered. See {@link #render}.
 * 
 *
 * Generic example:
 * 
 * 		@example
 *		var collection = new Collection();
 *		var view = new CollectionView({
 *			collection: collection
 *		});
 *		view.render();
 *		container.append(view.el);
 *	    
 */
define([
	"jquery",
	"underscore",
	"generic/View"
], function (
	$,
	_,
	View
) {
	var CollectionView = View.extend({
		/**
		 * View class which will be used for item's view
		 * @cfg {generic.View}
		 */
		itemView: View,

		// Search filter
		searchFilter: "",
		
		/**
		 * Limit number of items to display in CollectionView
		 * if limit is not specified or null, display all items
		 * @cfg {Number}
		 */
		limit: null,

		/**
		 * Initializate collection view 
		 * @param  {Array} models  Array of models
		 * @param  {Object} options extra options
		 */
		initialize: function (options) {
			var self = this;
			options = options || {};

			// if limit is not specifed all collection items will be displayed
			if (options.limit) {
				self.limit = options.limit || null;
			}

			if (options.itemView) {
				this.itemView = options.itemView;
			}

			View.prototype.initialize.apply(self, arguments);

			/**
			 * Initialize children view for each item in the collection
			 */
			if (self.collection) {
				// limit can be null, in this case - display all items in collection

				self.collection.each(function (model, i) {
					self.addItemView(model);
				});

				/**
				 * Subscribe to collection events, to add/remove/sort/toggleShowAll item views
				 */
				self.collection.on("remove", self.removeItemView, self);
				self.collection.on("add", self.addItemView, self);
				self.collection.on("sort", self.onCollectionSort, self);
			}
		},

		checkFilter: function (model) {
			var self = this;
			return self.collection.checkFilter(model) && self.checkSearchFilter(model)
		},
		
		/*
		 * Sets searchFilter on the collection and triggers search event
		 *
		 * @param value to be set
		 */
		search: function(value) {
			var self = this;
			self.searchFilter = value.trim();
			self.onCollectionSort();
		},

		checkSearchFilter: function (model) {
			var self = this, i = 0, pattern;
			
			if (self.searchFilter.length > 0) {
				pattern = RegExp(self.searchFilter, "i");
				var searchValues;
				var searchProperties = self.searchProperties || model.keys();
				if (_.isFunction(searchProperties)) {
					searchValues = searchProperties(model);
				} else {
					searchValues = _.map(searchProperties, function (p) { 
						return model.get(p);
					});
				}

				return _.some(searchValues, function (v) {
					return pattern.test(v);
				});
			}

			return true;
		},

		/**
		 * Calls when model removed from the collection
		 * @param  {Model} model
		 * @param  {Collection} collection
		 * @param  {Object} options
		 */
		removeItemView: function (model, collection, options) {
			var self = this;

			var view = _(self.children).find(function (view) {
				return view.model.cid === model.cid;
			});

			if (view) {
				self.remove(view);
				if (self.rendered) {
					view.destroy();
				}
			}
			var limit = self.limit || self.collection.length;
			var diff = limit - self.children.length;
			if (diff > 0) {
				var begin = self.children.length;
				var end = self.children.length + diff;
				var models = self.collection.slice(begin, end);
				_(models).each(function (model) {
					self.addItemView(model);
				});
			}
		},

		/**
		 * Calls when model added to the collection
		 * @param  {Model} model
		 * @param  {Collection} collection
		 * @param  {Object} options
		 */
		addItemView: function (model, collection, options) {
			var self = this;
			options = options || {};
			// check if view already exists, to not duplicate views
			var viewIdx = self.findViewByModel(model);
			if (viewIdx !== -1) {
				console.debug("view exists, don't add");
				return;
			}

			var limit = self.limit || self.collection.length;

			if ((self.children !== undefined && self.children.length >= limit) || !self.checkFilter(model)) {
				// don't add if rich limit or filtered
				return;
			}
			
			var view = self.add(self.createViewForModel(model));
			// render only if collection view is rendered
			if (self.rendered) {
				(options.container || self.getItemsContainer()).appendChild(view.el);
				view.render();
			}
		},

		/**
		 * Find view by mdoel
		 * @param  {Model} model
		 * @return {Number} index of view in children array
		 */
		findViewByModel: function (model) {
			var self = this,
				result = -1;

			_(self.children).each(function (view, idx) {
				if ((view.model.cid != null) && (view.model.cid === model.cid) || (view.model.get("id") != null) && (view.model.get("id") === model.get("id"))) {
					result = idx;
					return;
				}
			});
			return result;
		},

		/**
		 * Returns ItemView for model,
		 * can be overriden to implement more complex logic
		 * @param  {Model} model
		 * @return {Generic.View}
		 */
		createViewForModel: function (model) {
			var self = this;

			return new self.itemView({
				model: model
			});
		},

		/**
		 * Return children views container
		 * @return {DOMNode} container for children views
		 */
		getItemsContainer: function () {
			return this.el;
		},

		createDocumentFragment: function () {
			return document.createDocumentFragment();
		},

		/**
		 * Render children views and append them to the CollectoinView element.
		 * CollectionView tries to minimise browser reflow/ Document tree modification will trigger reflow. 
		 * Adding new elements to the DOM, changing the value of text nodes,
		 * or changing various attributes will all be enough to cause a reflow. 
		 * Making several changes one after the other, may trigger more than one reflow, 
		 * so in general, it is best to make multiple changes in a non-displayed DOM tree fragment.
		 * 
		 * @return this
		 */
		render: function () {
			var self = this;
			
			View.prototype.render.apply(self, arguments);

			var fragment = self.createDocumentFragment()
			_(this.children).each(function (childView) {
				fragment.appendChild(childView.el);
				childView.render();
			});
			self.getItemsContainer().appendChild(fragment);

			return this;
		},

		destroy: function () {
			if (this.collection) {
				this.collection.off(null, null, this);
			}
			return View.prototype.destroy.apply(this, arguments);;
		},

		/*
		 * Returns count of filtered views
		 */
		getFilteredCount: function() {
			var self = this,
				count = 0;

			self.collection.each(function(model) {
				if (self.checkFilter(model)) {
					count++;
				}
			})

			return count;
		},


		onCollectionSort: function () {
			var self = this;

			var fragment = document.createDocumentFragment();

			var models = self.collection.filter(self.checkFilter, self);
			var limit = self.limit;
			self.limit = self.collection.length + 1;
			var renderedViews = 0;
			_.each(models, function (model, idx) {
				var viewIdx = self.findViewByModel(model);
				var view;
				if (limit && renderedViews >= limit) {
					// don't add if rich limit or filtered
					return;
				}
				if (viewIdx > -1) {
					view = self.children[viewIdx];
					view.$el.appendTo(fragment);
				} else {
					self.addItemView(model, self.collection, {
						container: fragment
					});
				}
				renderedViews++;
			});
			self.limit = limit;
			$(self.getItemsContainer()).html(fragment);
		}
	});

	return CollectionView;
});
