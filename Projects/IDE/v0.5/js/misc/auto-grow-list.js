var autoGrowList = {
  isEmptyItem: (item, getEmptyItem) => {
    return (JSON.stringify(item) == JSON.stringify(getEmptyItem()));
  },
  findEmptyItems: (items, getEmptyItem) => {
    if (!items) return;
    return items.filter(a => autoGrowList.isEmptyItem(a, getEmptyItem));
  },
  verifyEmptyItem: (items, getEmptyItem) => {
    if (!items) return;
    var emptyItems = autoGrowList.findEmptyItems(items, getEmptyItem);
    if (!emptyItems.length) items.push(getEmptyItem());
    if (emptyItems.length > 1) {
      var index = -1;
      do
      {
        index = items.findIndex(a => autoGrowList.isEmptyItem(a, getEmptyItem));
        if (index != -1) items.splice(index, 1);
      }
      while (index != -1);
      items.push(getEmptyItem());
    }
  }
}
