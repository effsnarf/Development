// Keyboard utility class

class Keyboard {
    static on(key: string, callback: Function) {
        let modifier: string;
        // Find whether there's a modifier key ("ctrl-z", "alt-x", etc.)
        if (key.indexOf('+') !== -1) {
            modifier = key.split('+')[0];
            key = key.split('+')[1];
        }
        // Add the event listener
        document.addEventListener(`keypress`, (event: any) => {
            // If the key pressed is the one we're looking for
            if (event.code == `Key${key.toUpperCase()}`) {
                // If there's a modifier key
                if (modifier) {
                    // If the modifier key is pressed
                    if (event[modifier + 'Key']) {
                        callback();
                    }
                } else {
                    callback();
                }
            }
        });
    }
}


export { Keyboard }

