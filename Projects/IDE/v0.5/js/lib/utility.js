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

String.prototype.getWords = function()
{
    // Get words from string
    // Word characters only ([a-zA-Z0-9_])
    return this.match(/\w+/g) || [];
}

String.prototype.kebabize = function()
{
    // Convert to kebab-case
    let s = this.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    s = s.replace(/[^a-z0-9-]/g, '-');
    s = s.replace(/--+/g, '-');
    return s;
}
Array.prototype.sortBy = function(getKey)
{
    // Sort array by key
    // getKey: (item) => key
    return this.sort((a, b) => {
        const keyA = getKey(a);
        const keyB = getKey(b);
        if (keyA < keyB) return -1;
        if (keyA > keyB) return 1;
        return 0;
    });
}

Array.prototype.removeAll = function(predicate)
{
    const toRemove = this.filter(predicate);
    for (const item of toRemove)
    {
        this.splice(this.indexOf(item), 1);
    }
}

Array.prototype.distinctItems = function()
{
    return [...new Set(this)];
}

var util = {
    haml: (s) => {
        // Remove empty lines
        s = s.replace(/^\s*[\r\n]/gm, '');
        return HAML.compile(s)();
    },
    html: {
        escape: (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'),
    },
    clone: (obj) => JSON.parse(JSON.stringify(obj)),
    with: (obj, key, value) => {
        const newObj = Object.assign({}, obj);
        newObj[key] = () => value;
        return newObj;
    },
    traverse: (obj,
        onValue
      ) => {
        const _traverse = function (node, key, value) {
          onValue(node, key, value);
          if (value && typeof value === "object") {
            for (const k of Object.keys(value)) {
                _traverse(value, k, value[k]);
            }
          }
        };
        _traverse(obj, "", obj);
      },
      distinctItems: (arr) => arr.distinctItems(),
}