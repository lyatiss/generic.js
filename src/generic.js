define("generic", [
	"generic/View",
	"generic/CollectionView",
	"generic/TableView"
], function (
	View,
	CollectionView,
	TableView
) {
	return {
		View: View,
		CollectionView: CollectionView,
		TableView: TableView
	};
});
