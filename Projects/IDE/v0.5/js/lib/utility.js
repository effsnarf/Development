// Saved in localStorage
// Forwards push, splice, length
class LocalPersistedArray
{
    constructor(key)
    {
        this.items = [];
        this.key = key;
        this.load();
    }

    push(...args)
    {
        this.items.push(...args);
        this.save();
    }

    splice(...args)
    {
        this.items.splice(...args);
        this.save();
    }

    get length()
    {
        return this.items.length;
    }

    load()
    {
        let items = localStorage.getItem(this.key);
        if (items)
        {
            this.items = JSON.parse(items);
        }
        else
        {
            this.items = [];
        }
    }

    save()
    {
        localStorage.setItem(this.key, JSON.stringify(this.items));
    }
}

_ = (_ || {});
_.rtrim = (s) => s.replace(/\s+$/, '');
_.ltrim = (s) => s.replace(/^\s+/, '');
_.trim = (s) => _.ltrim(_.rtrim(s));
_.startsWith = (s, prefix) => s.indexOf(prefix) === 0;
_.endsWith = (s, suffix) => s.indexOf(suffix, s.length - suffix.length) !== -1;

var util = {
    haml: (s) => haml.compileStringToJs(s)()
}