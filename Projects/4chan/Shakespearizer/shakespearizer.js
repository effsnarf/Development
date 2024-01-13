

class Shakespearizer {
    constructor() {
        this.queue = [];
        this.processQueue = this.processQueue.bind(this);
        this.processInterval = 1000;
        this.processQueue();
    }

    async shakespearize(text) {
        const promise = new Promise((resolve, reject) => {
            this.queue.push({ text, promise: { resolve, reject } });
        });
        return promise;
    }

    async processQueue() {
        // Take some tasks from the queue
        const tasks = this.queue.splice(0, 10);

        if (tasks.length) {
            const texts = tasks.map(task => task.text);
            const response = await fetch("https://db.memegenerator.net/shakespearize", {
                method: "POST",
                body: JSON.stringify({ texts }),
                mode: "cors",
                credentials: "omit"
            });
            const results = await response.json();

            // Resolve the promises
            for (const result of results) {
                const task = tasks.find(task => task.text === result.text);
                if (!task) continue;
                task.promise.resolve(result.shakespearized);
            }
        }

        setTimeout(() => this.processQueue(), this.processInterval);
    }
}

