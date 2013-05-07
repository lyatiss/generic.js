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
		
		/**
		 * Initializate collection view 
		 * @param  {Array} models  Array of models
		 * @param  {Object} options extra options
		 */
		initialize: function (options) {
			var self = this;
			options = options || {};

			if (options.itemView) {
				this.itemView = options.itemView;
			}

			View.prototype.initialize.apply(self, arguments);

			/**
			 * Initialize children view for each item in the collection
			 */
			if (self.collection) {
				self.collection.each(function (model) {
					self.add(self.createViewForModel(model));
				});
				/**
				 * Subscribe to collection events, to add/remove item view
				 */
				self.collection.on("remove", self.removeItemView, self);
				self.collection.on("add", self.addItemView, self);
			}
		},

		/**
		 * Calls when model removed from the collection
		 * @param  {Model} model
		 * @param  {Collection} collection
		 * @param  {Object} options
		 */
		removeItemView: function (model, collection, options) {
			var view = _(this.children).find(function (view) {
				return view.model.cid === model.cid;
			});
			if (view) {
				this.remove(view);
				if (this.rendered) {
					view.destroy();
				}
			}
		},

		/**
		 * Calls when model added to the collection
		 * @param  {Model} model
		 * @param  {Collection} collection
		 * @param  {Object} options
		 */
		addItemView: function (model, collection, options) {
			// check if view already exists, to not duplicate views
			var viewIdx = this.findViewByModel(model);
			if (viewIdx !== -1) {
				console.log("tried to add view more then one time");
				return;
			}
			var view = this.add(this.createViewForModel(model));
			if (this.rendered) {
				view.render();
				this.el.appendChild(view.el);
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
				if (view.model.cid === model.cid) {
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

			var fragment = document.createDocumentFragment();
			_(this.children).each(function (childView) {
				fragment.appendChild(childView.render().el);
			});
			self.getItemsContainer().appendChild(fragment);

			return this;
		},

		/**
		 * Filter by value. Case insesetive
		 * @param  {String} value
		 */
		filter: function (value) {
			var self = this;
			value = value.toLowerCase();

			self.collection.each(function (model) {
				var values = _.values(model.attributes);
				// get all values and check, if all values doesn't match filter request
				var filtered = _.every(values, function (v) {
					if (!_.isString(v)) { return true; }
					return !(v.toLowerCase().match(value));
				});

				if (filtered) {
					self.removeItemView(model);
				} else {
					self.addItemView(model);
				}
			});
		},

		/**
		 * Sort method
		 * Not implemented
		 * 
		 */
		sort: function () {
			// TODO: not implemented
		}
	});

	return CollectionView;
});