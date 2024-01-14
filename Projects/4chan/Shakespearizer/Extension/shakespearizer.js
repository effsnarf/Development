

class Shakespearizer {
    constructor() {
        this.apiKey = null;
        this.tasks = [];
        this.processingTasks = [];
        this.processQueue = this.processQueue.bind(this);
        this.processInterval = 1;
        this.processQueue();
        this.error = {
            last: {
                apiKey: 'initial key not set',
                server: {
                    error: null,
                }
            },
        }
    }

    async shakespearize(text) {
        const apiKey = (await promisify(chrome.storage.sync, 'get')('apiKey')).apiKey;
        
        if (!(apiKey||'').trim().length) {
            if (this.error.last.apiKey != apiKey) {
                this.error.last.apiKey = apiKey;
                this.onError("Please enter an OpenAI API key");
            }
            return new Promise((resolve, reject) => { resolve(text); });
        }

        this.apiKey = apiKey;

        const existingTask = this.getExistingTask(text);
        if (existingTask) return existingTask.promise;
        // Check if the text is already in the queue
        const task = this.tasks.find(task => task.text === text);
        if (task) return task.promise;
        // Check if the text is already being processed
        const processingTask = this.processingTasks.find(task => task.text === text);
        if (processingTask) return processingTask.promise;
        // Add the text to the queue
        const promise = new Promise((resolve, reject) => {
            this.tasks.push({ text, promise: { resolve, reject } });
        });
        return promise;
    }

    getExistingTask(text) {
        return null ||
            this.tasks.find(task => task.text === text) ||
            this.processingTasks.find(task => task.text === text);
    }


    async textToShakespearized(texts) {
        const response = await fetch("https://db.memegenerator.net/shakespearize", {
            method: "POST",
            body: JSON.stringify({ openAiApiKey: this.apiKey, texts }),
            mode: "cors",
            credentials: "omit"
        });
        const results = await response.json();
        if (results.error) {
            if (this.error.last.server.error != results.error) {
                this.error.last.server.error = results.error;
                this.onError(results.error);
                throw new Error(results.error);
            }
        }
        return results;
    }

    resolveTask(result) {
        const task = this.processingTasks.find(task => task.text === result.text);
        if (!task) return;
        task.promise.resolve(result.shakespearized);
        this.removeTask(this.processingTasks, task);
    }

    removeTask(tasks, task) {
        const index = tasks.indexOf(task);
        if (index !== -1) tasks.splice(index, 1);
    }

    async processQueue() {
        const tasks = this.tasks.splice(0, 10);
        this.processingTasks.push(...tasks);

        if (tasks.length) {
            const texts = tasks.map(task => task.text);

            const results = await this.textToShakespearized(texts);

            for (const result of results) {
                this.resolveTask(result);
            }
        }

        setTimeout(() => this.processQueue(), this.processInterval);
    }

    onSettingsChange() {
        this.error.last.apiKey = null;
        this.error.last.server.error = null;
    }

    onError(message) {
        alert(`4chan Shaekspearizer - ${message}`);
    }
}

