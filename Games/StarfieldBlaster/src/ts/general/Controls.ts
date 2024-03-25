// enum KeyDirection
enum KeyDirection {
  Press = 1,
  Release = -1,
}

class Controls {
  private listeners: {
    key: string;
    onKey: (direction: KeyDirection) => void;
  }[] = [];

  private keyStates: { [key: string]: KeyDirection } = {};

  on = (key: string, onKey: (direction: KeyDirection) => void) => {
    this.listeners.push({ key, onKey });
  };

  private constructor() {
    document.addEventListener("keydown", (e: KeyboardEvent) =>
      this.onKey(e, KeyDirection.Press)
    );
    document.addEventListener("keyup", (e: KeyboardEvent) =>
      this.onKey(e, KeyDirection.Release)
    );
  }

  static new() {
    const controls = new Controls();
    return controls;
  }

  private onKey(e: KeyboardEvent, direction: KeyDirection) {
    if (this.keyStates[e.key] === direction) return;

    this.keyStates[e.key] = direction;

    for (const listener of this.listeners) {
      if (e.key === listener.key) {
        listener.onKey(direction);
      }
    }
  }
}

export { Controls, KeyDirection };
