var dragAndDrop = {
  getDragData: (dropzone, key, value) => {
    var e = {
      dropzone: dropzone,
      data: {}
    };
    e.data[key] = value;
    return e;
  }
};
