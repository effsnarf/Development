enum KeyDirection {
  Down,
  Up,
}

type KeyCallback = (e: KeyboardEvent, dir: KeyDirection) => void;

class Input {
  static pressedKeys: { [key: string]: boolean } = {};

  on = {
    key: function (callback: KeyCallback) {
      document.addEventListener("keydown", (event) => {
        const key = event.key;
        if (!Input.pressedKeys[key]) {
          Input.pressedKeys[key] = true;
          callback(event, KeyDirection.Down);
        }
      });
      document.addEventListener("keyup", (event) => {
        const key = event.key;
        if (Input.pressedKeys[key]) {
          Input.pressedKeys[key] = false;
          callback(event, KeyDirection.Up);
        }
      });
    },
  };
}

export { Input, KeyCallback, KeyDirection };
