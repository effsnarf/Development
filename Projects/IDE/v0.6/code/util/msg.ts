// Message class for simple alerts

class msg {
    static async alert(message: string) {
        return (await this.message(`alert`, message));
    }

    static async warning(message: string) {
        return (await this.message(`warning`, message));
    }

    static async error(message: string) {
        return (await this.message(`error`, message));
    }

    // Creates a <div class="msg-[type]"> element with the given message
    // and adds it to a global <div class="msg-container"> element
    private static async message(type: string, message: string, timeout: number = 5000) {
        // Create the message element
        let msg = document.createElement(`div`);
        msg.classList.add(`msg`);
        msg.classList.add(`${type}`);
        msg.textContent = message;
        // Add the message element to the container
        let container = document.querySelector(`.msg-container`);
        if (!container) {
            container = document.createElement(`div`);
            container.classList.add(`msg-container`);
            document.body.appendChild(container);
        }
        container.prepend(msg);
        // After 1ms, add the "visible" class to the message element
        setTimeout(() => {
            msg.classList.add(`visible`);
        }, 1);

        // After the timeout, remove the "visible" class,
        // wait another second and then remove the message element from the container
        setTimeout(() => {
            msg.classList.remove(`visible`);
            setTimeout(() => {
                container?.removeChild(msg);
            }, 1000);
        }, timeout);
    }
}


export { msg };
