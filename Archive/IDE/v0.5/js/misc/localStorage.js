
var localStoragePlugin = {

  getItem: function(key) {
    return null;
  },
  setItem: function(key, value) {

  }
};

if (typeof(window) != `undefined`)
{
  window.$localStorage = localStoragePlugin;
}
