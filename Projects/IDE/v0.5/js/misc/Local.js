class Local
{
    static db = new Dexie("IDE");
   
    static cache = {
        get: async (key, getValue) => {
            const started = Date.now();

            try
            {
                const origKey = key;

                key = md5(key);

                let value = (await Local.db.Cache.where("key").equals(key).toArray())[0]?.value;

                const elapsed = Date.now() - started;

                if (value) {
                    //console.log(`Cache hit ${origKey.substring(0, 10)} ${elapsed} ms`);
                    return value;
                }
            
                //console.log(`Cache miss ${origKey.substring(0, 10)} ${elapsed} ms`);
            
                // Call getValue() to fetch the value
                value = getValue();
            
                Local.cache.set(key, value);
            
                return value;
            }
            finally {
                const elapsed = Date.now() - started;
                //console.log(elapsed);
                //if (elapsed > 100) debugger;
            }
        },
        set: async (key, value) => {
            key = md5(key);
            // Store the new value in IndexedDB
            await Local.db.Cache.put({ key, value });
        },
        has: async (key) => {
            key = md5(key);
            return (await Local.db.Cache.where("key").equals(key).toArray()).length;
        }
    };
}


const collections = {
    ComponentClasses: ['_id', 'name', '_item'],
    Cache: ['key', 'value'],
}

Local.db.version(1).stores(Object.fromEntries(Object.entries(collections).map(([name, keys]) => [name, keys.join(",")])));


const logify = (obj, method) => {
    const orig = obj[method];
    obj[method] = async (...args) => {
        console.log(method, args);
        return await orig.apply(obj, args);
    }
}

logify(Local.db.ComponentClasses, "bulkPut");
