define("generic", [
	"generic/View",
	"generic/CollectionView",
	"generic/TableView"
], function (
	View
) {
	return {
		View: View,
		CollectionView: CollectionView,
		TableView: TableView
	};
});
