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

		initialize: function (options) {
			options = options || {};

			this.columns = options.columns;

			CollectionView.prototype.initialize.apply(this, arguments);
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

		/**
		 * Render table's header if columns property specified
		 * @protected
		 */
		renderTableHeader: function () {
			if (!this.columns) {
				return;
			}
			var thead = document.createElement("thead");
			var tr = document.createElement("tr");
			thead.appendChild(tr);

			_.each(this.columns, function (column) {
				var th = document.createElement("th");
				tr.appendChild(th);
				var $th = $(th);
				if (_.isString(column)) {
					column = {
						title: column,
						attrs: {}
					};
				}
				$th.text(column.title);

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
		}
	});

	return TableView;
});
