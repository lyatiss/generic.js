/**
 * @class  Generic.TableView
 * @extends Backbone.View
 *
 * Implements generic table with sorting and filtering logic
 */
define([
	"jquery",
	"underscore",
	"generic/CollectionView"
], function (
	$,
	_,
	CollectionView
) {
	var TableView = CollectionView.extend({
		tagName: "table",
		itemsContainer: "tbody",
		className: "data-table",

		/**
		 * Array with columns descriptions, each entry can be a string, that will be used as column title,
		 * or it can be an object, e.g: {title: "Status", cssClass: "column-status"}
		 * @type {Array}
		 */
		columns: undefined,

		/*
		 * Attach click listener for <a> tag in table header
		 */
		events: {
			"click th a": "sort", 
			"click tr.resourceMain>td": "select"
		},

		initialize: function (options) {
			options = options || {};
			var self = this;
			self.columns = options.columns;
			CollectionView.prototype.initialize.apply(this, arguments);

			self.collection.on("toggleShowAll", self.toggleShowAll, self);

			// By defaut multiple selection is not actived
			self.multipleSelection = options.multipleSelection || false;
		},

		/**
		 * Returns columns configuration
		 * 
		 * @protected
		 * @return {Array} array with columns description
		 */
		getColumnsConfig: function () {
			return this.columns;
		},

		/**
		 * For tables items container is tbody.
		 * @return {DOMNode}
		 */
		getItemsContainer: function () {
			var tbody = this.$("tbody").get(0);
			if (!tbody) {
				tbody = document.createElement("tbody");
				this.el.appendChild(tbody);
			}
			return tbody;
		},

		getSelectedModels: function () {
			var self = this;
			var models = [];
			_(self.children).each(function (view, idx) {
				if (view.$el.hasClass("selected")) {
					models.push(view.model);
				}
			});
			return models;
		},

		clearSelection: function () {
			var self = this;
			_(self.children).each(function (view, idx) {
				view.$el.removeClass("selected");
			});
		},

		/*
		 * Displays or removes extra rows depending on this.showAll property
		 */
		toggleShowAll: function() {
			var self = this;
			// var limit = self.limit || self.collection.length; 
			console.debug("toggleShowAll");
			if (self.showAll) {
				self.limit = self._limit;
				delete self._limit;
			} else {
				self._limit = self.limit;
				self.limit = null;
			}
			self.showAll = !self.showAll;
			self.onCollectionSort();
		},

		/**
		 * Render table's header if columns property specified
		 * @protected
		 */
		renderTableHeader: function () {
			var self = this;

			if (!self.columns) {
				return;
			}
			var thead = document.createElement("thead");
			var tr = document.createElement("tr");
			thead.appendChild(tr);

			_.each(self.columns, function (column) {
				var th = document.createElement("th");
				tr.appendChild(th);
				var $th = $(th);
				if (_.isString(column)) {
					column = {
						title: column,
						attrs: {}
					};
				}

				// check if if collection is already sorted, if so display appropriate icon
				if (self.sortable(column.title) && self.collection.length > 1) {
					if (self.collection.sortColumn == column.title.toLowerCase()) {
						if (self.collection.sortOrder == "asc")
							$th.html("<a href='#'>" + column.title + "<i class='icon-sort'></i><i class='icon-sort-up' style='display:inline'></i></a>");
						else
							$th.html("<a href='#'>" + column.title + "<i class='icon-sort'></i><i class='icon-sort-down' style='display:inline'></i></a>");
					}
					else {
						$th.html("<a href='#'>" + column.title + "<i class='icon-sort'></i><i></i></a>");
					}
				}
				else {
					$th.text(column.title);
				}

				// assign attributes to the header column if defined
				column.attrs && $th.attr(column.attrs);
			});
			
			this.el.appendChild(thead);
		},

		/**
		 * Table view also render header automaticaly
		 * @return {[type]} [description]
		 */
		render: function () {
			// construct header
			
			this.renderTableHeader();
			
			CollectionView.prototype.render.apply(this, arguments);

			return this;
		},


		/*
		 * Calls sortByColumn method on collection
		 * Updates table header icons
		 *
		 * @return self
		 */
		sort: function(e) {
			var self = this,
					a = $(e.currentTarget),
					column = a.text().toLowerCase(),
					order = "asc";

			e.preventDefault();
			
			if (self.collection.length > 1) {
				// update icons in table header
				self.updateHeaderIcons(a);

				// asign sort order
				a.find("i:last").hasClass("icon-sort-up") ? order = "asc" : order = "desc";

				// delegate sorting to common/Collection.js
				self.collection.sortByColumn(column, order);
			}

			return self;
		},

		select: function(eventElement) {
			var self = this;
			if (self.multipleSelection) {
				var $td = $(eventElement.target);
				if( $td.prop("tagName") == "TD") {
					$td.parent("tr.resourceMain").toggleClass("selected");
				}
				var selected = self.$("tr.resourceMain.selected").length;
				var all = self.$("tr.resourceMain").length;
				
				if(selected){
					self.trigger("selected");
				} else if (!selected){
					self.trigger("unselected");
				}
			}
		},

		/*
		 * Checks if column is sortable
		 *
		 * @return bolean
		 */
		sortable: function(column) {
			return [ "status", "name", "provider", "compute platform", "type", "zone", "sensor", "region"].indexOf(column.toLowerCase()) >= 0;
		},

		/*
		 * Updates icons in table header
		 *
		 * @param DOMnode (currentTarget)
		 */
		updateHeaderIcons: function(a) {
			// loop through each <a> tag in table header and reset icons
			this.$("tr th a").each(function () {
				var el = $(this);
				if (el.text() != a.text()) {
					el.find("i:last").hide().removeClass("icon-sort-up icon-sort-down");
				}
			});

			// asign proper icon
			if (a.find("i:last").hasClass("icon-sort-down")) {
				a.find("i:last").toggleClass("icon-sort-up icon-sort-down");
			}
			else if (a.find("i:last").hasClass("icon-sort-up")) {
				a.find("i:last").toggleClass("icon-sort-up icon-sort-down");
			}
			else {
				a.find("i:last").toggleClass("icon-sort-up").css("display", "inline");
			}
		}

	});

	return TableView;
});
