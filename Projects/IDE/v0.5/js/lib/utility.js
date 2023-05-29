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
        const items = this.items.splice(...args);
        this.save();
        return items;
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

String.prototype.getNumbers = function()
{
    // Get numbers from string
    // Decimal numbers only
    return this.match(/\d+(\.\d+)?/g) || [];
}

String.prototype.kebabize = function()
{
    // Convert to kebab-case
    let s = this.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    s = s.replace(/[^a-z0-9-]/g, '-');
    s = s.replace(/--+/g, '-');
    return s;
}

String.prototype.titleize = function()
{
    // Convert to Title Case
    return this.replace(/\w+/g, (s) => s.charAt(0).toUpperCase() + s.substring(1).toLowerCase());
}

String.prototype.separateWords = function()
{
    // Separate words in string
    // "helloWorld" => "hello world"
    return this.replace(/([a-z])([A-Z])/g, '$1 $2');
}

String.prototype.matchAllRegexes = function(regex)
{
    return [...(this.toString().matchAll(regex))].map(m => m[0]);
}

String.prototype.getRegexMatches = function(regex)
{
    return this.matchAllRegexes(regex);
}

String.prototype.toSingular = function()
{
    return util.toSingular(this);
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

Array.prototype.distinct = function(selector)
{
    if (!selector) selector = (item) => item;
    const keys = [];
    const distinctItems = [];
    for (const item of this)
    {
        const key = selector(item);
        if (keys.indexOf(key) === -1)
        {
            keys.push(key);
            distinctItems.push(item);
        }
    }
    return distinctItems;
}

Array.prototype.distinctItems = function()
{
    return this.distinct();
}

Array.prototype.except = function(item) {
	return this.filter(a => (a != item));
}

Array.prototype.sum = function(selector)
{
    if (!selector) selector = (item) => item;
    let sum = 0;
    for (const item of this)
    {
        sum += selector(item);
    }
    return sum;
}

Array.prototype.average = function(selector)
{
    if (!selector) selector = (item) => item;
    return parseFloat((this.sum(selector) / this.length).toFixed(2));
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
    number: {
        commas: (n) => {
            // Add thousands commas to number
            // 1234567 => 1,234,567
            return n.toLocaleString();
        }
    },
    getProperty: (obj, path) => {
        // Get property from object
        // path: 'a.b.c'
        return path.split('.').reduce((o, i) => o[i], obj);
    },
    toSingular: (s) => {
        // Convert to singular
        if (s.endsWith('ies')) return s.substring(0, s.length - 3) + 'y';
        if (s.endsWith('es')) return s.substring(0, s.length - 2);
        if (s.endsWith('s')) return s.substring(0, s.length - 1);
        return s;
    }
}