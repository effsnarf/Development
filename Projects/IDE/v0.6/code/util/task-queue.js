// TaskQueue class
// A queue of tasks to be executed
// Performs the tasks in the order they were added, one at a time
// in an asynchronous loop to prevent blocking the main thread

class TaskQueue {
    constructor(mm) {
        this.mm = mm;
        this.queue = [];
        this.running = false;
    }

    // Enqueues a module method to be executed
    // Alternatively, the first argument can be a function
    enqueue(oid, method, args) {
        let task = (typeof oid === 'function') ? { func: oid } : { moduleMethod: { oid, method, args } };

        return new Promise((resolve, reject) => {
            this.queue.push({ ...task, resolve, reject });
            this.run();
        });
    }

    run() {
        if (this.running) return;
        this.running = true;
        const next = async () => {
            if (this.queue.length === 0) {
                this.running = false;
                return;
            }
            const task = this.queue.shift();
            try {
                const result = await this.execute(task);
                task.resolve(result);
            } catch (error) {
                task.reject(error);
            }
            setTimeout(next, 0);
        };
        setTimeout(next, 0);
    }

    execute(task) {
        if (task.func) {
            return task.func();
        }
        else {
            const modm = task.moduleMethod;
            return this.mm.invoke(modm.oid, modm.method, modm.args);
        }
    }
}


export { TaskQueue }
