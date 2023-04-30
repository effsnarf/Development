import { Ref } from "@vue/runtime-dom";

class Logger
{
    private static id: number = 1;

    private static _items: Ref<any[]> = ref([]);

    public static get items() { return Logger._items.value; }

    static log(icon: (string | null), cls: string, method: string, text: (string | null), data: any)
    {
        let item = { id: (Logger.id++), dt: Date.now(), icon, cls, method, text, data };
        Logger.items.push(item);
    }
}


export { Logger }
