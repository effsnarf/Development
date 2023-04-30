var linq = Enumerable.from;

var util = {
	_uniqueIdentityCounter: 1,

	clone: (obj) => {
		return JSON.parse(JSON.stringify(obj));
	},

	alert: (...args) => {
		alertify.message(JSON.stringify(args));
	},

	sleep: (ms) => {
		return new Promise(resolve => setTimeout(resolve, ms));
	},

	callOnce: (func, within=300, timerId=null) => {
    window.callOnceTimers = window.callOnceTimers || {};
    if (timerId == null) 
        timerId = func;
    var timer = window.callOnceTimers[timerId];
    clearTimeout(timer);
    timer = setTimeout(() => func(), within);
    window.callOnceTimers[timerId] = timer;
	},

	shorten: (s, length) => {
		if (!s) return s;
		if (typeof(s) != "string") s = JSON.stringify(s);
		return s.substring(0, length);
	},

	toPlural: (s) => {
		if (!s) return s;
		if (s.endsWith("y")) return `${s.slice(0, s.length - 1)}ies`;
		if (s.endsWith("s")) return `${s}es`;
		return `${s}s`;
	},

  visualize: (obj) => {
  	try
  	{
  		return JSON.stringify(obj);
  	}
  	catch (ex)
  	{
  		return `[object]`;
  	}
  },

	toFriendlyString: (obj) => {
		var s;
		if (typeof(obj) == "object")
		{
			var keys = Object.keys(obj).filter(key => (typeof(obj[key]) == "string"));
			if (keys.length > 0)
			{
				if (keys.length > 3) keys.length = 3;
				return keys.map(key => obj[key]).join(", ");
			}
		}

		if (typeof(obj) == "string") return obj;

		s = JSON.stringify(obj);
		return s;
	},

    events: {
    	bindAll: (element, events, handler) => {
		    for(var i = 0; i < events.length; i++) {
		        element.addEventListener(events[i], handler);
		    }
		}
    },

    parser: {
      getExpressions: (code) => {
	  	  var ast = esprima.parse(code, {range:true});
		  var getNodes = (node) => {
		    if (Array.isArray(node)) return node.map(b => b);
		    return Object.keys(node)
		      .map(key => node[key])
		      .filter(b => (b != null))
		      .filter(b => b.type)
		      .map(b => b);
		  }

		  var all = [];
		  var flatten = (node) =>
		  {
		    var nodes = getNodes(node);
		    all = all.concat(nodes.map(b => {return {
		    	type:b.type,
		    	str:code.substring(b.range[0], b.range[1])
		    }}));
		    nodes.forEach(b => flatten(b));
		  }
		  flatten(ast.body);
		  return all;
		}
    },

	getNewID: () => (`unique${util._uniqueIdentityCounter++}`),

	try: (func, onEx) => {
		try { return func(); } catch (ex) { if (!onEx) ; else return onEx(ex.message); }
	},

	equals: (a, b) => {
      return (JSON.stringify(a) == JSON.stringify(b));
	},

	splitToPaths: (str, separator) => {
		return (!str) ? null : str.split(".").map((a,i) => str.split(".").slice(0,i+1));
	},

	lastPathItem: (str) => (!str) ? null : str.split(".")[str.split(".").length - 1],



  download: (data, filename, type) => {
    var file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        var a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
	},


	traverse: (obj, callback, path, depth) => {
		if (!obj) return;
		if (typeof(obj) != "object") return;
		if (!depth) depth = 0;
		//console.log(`depth is ${depth}`);
		//if (depth > 2) return;
		if (Array.isArray(obj))
		{
			//console.log("obj is array");
			//for (var i = 0; i < obj.length; i++) callback(i, obj[i]);
			return;
		}
		//console.log("obj is ", obj);
		//console.log("keys are ", Object.keys(obj));
		Object.keys(obj).forEach(key => {
			var path2 = (path) ? (`${path}.${key}`) : key;
			callback(obj, key, path2);
			//console.log(key);
			//console.log(`${key} is ${JSON.stringify(obj[key])}`);
			util.traverse(obj[key], callback, path2, (depth + 1));
		});
	},

	isFunction: (str) => {
		if (!str) return false;
		str = str.trim();
		if (str.indexOf("(") == 0)
		{
			if (str.split("\n")[0].indexOf("=>") != -1)
			{
				return true;
			}
		}
	},

	indent: (str, indent, tabSize, minusFirstLine) => {
		if (!str) return str;
		if (!indent) indent = 0;
		if (!tabSize) tabSize = 2;
		if (typeof(minusFirstLine) === "undefined") minusFirstLine = true;
		var indStr = Enumerable.range(0, (indent * tabSize)).toArray().map(a => " ").join("");
		var lines = str
		  .split("\n")
		  .map(a => `${indStr}${a}`);

		if (minusFirstLine) lines[0] = lines[0].substring(indStr.length);

		return lines.join("\n");
	},

    json: (obj) => {
      return JSON.stringify(obj);
    },

    postpone: (func, delay) =>
    {
    	if (!delay) delay = 0;
    	window.setTimeout(func, delay);
    },

    distinct: (value, index, self) => {
	  return self.indexOf(value) === index;
	},

	spaces: (count) => {
		return Enumerable.range(0, count).toArray().map(a => "  ").join("");
	},

    posToXY: (pos) => {
      return {x:parseInt(pos.left), y:parseInt(pos.top)};
    },

    xyToPos: (pos) => {
    	return {left: pos.x, top: pos.y};
    },

    whToWidthHeight: (size) => {
    	return {width: size.w, height: size.h};
    },

    forEachKey: (obj, callback) => {
    	if (!obj) return false;
    	Object.keys(obj).forEach(key => callback(key, obj[key]));
    },

    htmlDecode: (str) => {
		var e = document.createElement('textarea');
		e.innerHTML = str;
		// handle case of empty input
		var result = (e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue);
		return result;
	},

    snapToGrid: (obj, width, height) =>
    {
    	if (typeof(width) === "object")
    	{
    		var grid = width;
    		width = grid.width;
    		height = grid.height;
    	}

        if (typeof(obj.x) !== "undefined")
        {
    	  var a = Math.floor(obj.x / width) * width;
    	  var b = Math.floor(obj.y / height) * height;
    	  return {x:a, y:b};
        }
        else
        {
    	  var a = Math.floor(obj.width / width) * width;
    	  var b = Math.floor(obj.height / height) * height;
    	  return {width:a, height:b};
        }
    },

    stringifyFunctions: function(obj)
    {
    	if (!obj) return null;
    	
    	var res = {};

    	Object.keys(obj).forEach(a => res[a] = `func(${obj[a].toString()})`);

    	return JSON.stringify(res, null, 1);
    },

	getProperty(obj, prop)
	{
		if (!obj) throw "obj is null.";
		if (!prop) return obj;
		var names = prop.split(".");
		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			obj = obj[name];
		}
		return obj;
	},

	setProperty(obj, prop, value)
	{
		var names = prop.split(".");
		if (names.length == 0)
		{
		  obj[prop] = value;
		  return;	
		}
		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			if (i < (names.length - 1)) obj = obj[name];
		}
		obj[name] = value;
	},

	deleteProperty(obj, prop)
	{
		var names = prop.split(".");
		for (var i = 0; i < names.length; i++)
		{
			var name = names[i];
			if (i < (names.length - 1)) obj = obj[name];
		}
		delete obj[name];
	},

	object: {
		removeAll: (obj, predicate) => {
			Object.keys(obj).forEach(k => {
				if (predicate(obj[k])) delete obj[k];
			})
		}
	},

	objToKoAttr: function(obj) {
		if (obj.visible)
		{
			return `visible: ${obj.visible}`;
		}
		if (obj.invisible)
		{
			return `hidden: ${obj.invisible}`;
		}
		if (obj.src)
		{
			return `attr: { src: ${obj.src} }`;
		}
		if (obj.text)
		{
			return `text: ${obj.text}`;
		}
		if (obj.textInput)
		{
			return `textInput: ${obj.textInput}`;
		}
		if (obj.template)
		{
			return `template: ${obj.template}`;
		}
	},

	koToJs: function(kobj) {
		var obj = {};
		var keys = Object.keys(kobj);
		for (var i = 0; i < keys.length; i++)
		{
			var key = keys[i];
			if (ko.isWritableObservable(kobj[key])) obj[key] = ko.mapping.toJS(kobj[key]);
		}
		return obj;
	},

	refreshObservable: (obs, emptyValue) => {
      var value = obs();
      obs(emptyValue);
      obs(value);
	},

	anim: {
		flashClass: (el, className, duration) => {
			if (typeof(duration) == "undefined") duration = 400;
			$(el).addClass(className);
			window.setTimeout(() => { $(el).removeClass(className); }, duration);
		},
        hide: async (el, duration, onComplete) => {
        	el = $(el);
        	await el.animate({opacity: 0}, duration, onComplete).promise();
        },

        remove: async (el, duration, onComplete) => {
        	el = $(el);
        	await util.anim.hide(el, duration, () => {
        	});
    		el.remove();
    		if (onComplete) onComplete();
        },
        
        show: async (el, duration, onComplete) => {
        	el = $(el);
        	el.css({opacity:0});
        	await el.animate({opacity: 1}, duration, onComplete).promise();
        },

        refuse: (el) => {
        	el = $(el);
        	var x = el.position().left;
        	var ofs = 20;
        	var duration = 60;
        	el.animate({left:x-ofs}, duration/2)
        	  .delay(duration)
        	  .animate({left:x+ofs}, duration)
        	  .delay(duration)
        	  .animate({left:x-ofs}, duration)
        	  .delay(duration)
        	  .animate({left:x+ofs}, duration)
        	  .delay(duration)
        	  .animate({left:x-ofs}, duration)
        	  .delay(duration)
        	  .animate({left:x}, duration)
        	  .delay(duration)
        	  ;
        },

        callout: (el) => {
        	el = $(el);
         	var x = el.position().left;
        	var size = 0.14;
        	var duration = 40;
        	el.animate({zoom:1+size}, duration/2)
        	  .delay(duration)
        	  .animate({zoom:1}, duration)
        	  .delay(duration)
        	  .animate({zoom:1+size}, duration)
        	  .delay(duration)
        	  .animate({zoom:1}, duration)
        	  .delay(duration)
        	  .animate({zoom:1+size}, duration)
        	  .delay(duration)
        	  .animate({zoom:1}, duration)
        	  .delay(duration)
        	  ;
       },

		tween: (el1, el2, duration) => {
		  var $el1 = $(el1).clone();
		  var $el2 = $(el2);

		  $el1.appendTo($(el1).parent());
		  $el1.css("position", "fixed");
		  $el1.css($(el1).absOffset());
		  $(el1).css("visibility", "hidden");

		  $el1.animate($el2.absOffset(), duration);

		  return;

		    //$el2.animate(anim2, { duration: duration, queue: false, });
		  
		  //alert(JSON.stringify($el1.getStyleObject()));
		  
		  //alert(JSON.stringify($el1[0].getBoundingClientRect()));
		  
		  //var anim1 = Object.assign({}, $el1.getStyleObject());
		  //var anim2 = Object.assign({}, $el2.getStyleObject());
		  var anim1 = {};
		  var anim2 = {};

		  anim1 = Object.assign(anim1, $el1.absOffset(), {width: $el1.width(), height: $el1.height()});
		  anim2 = Object.assign(anim2, $el2.absOffset(), {width: $el2.width(), height: $el2.height()});
		  
		  $el1.css("position", "fixed");
		  $el2.css("position", "fixed");
		  $el1.animate(anim2, { duration: duration, queue: false });
		  return;

		  $(function () {
		    $el1.animate(anim2, { duration: duration, queue: false });

		    $el2.animate(anim2, { duration: duration, queue: false, });
		    
		    setTimeout(()=> {$el1.css(anim1)}, (true?1:2)*duration);
		  });
		  
		}

	},

	getCaretPosition: function(ctrl) {
	    var start, end;
	    if (ctrl.setSelectionRange) {
	        start = ctrl.selectionStart;
	        end = ctrl.selectionEnd;
	    } else if (document.selection && document.selection.createRange) {
	        var range = document.selection.createRange();
	        start = 0 - range.duplicate().moveStart('character', -100000);
	        end = start + range.text.length;
	    }
	    return {
	        start: start,
	        end: end
	    }
	},

	getWordAtCaret: function(element, textWordOnly) {
		try
		{
	    var caret = util.getCaretPosition(element);

	    var last = /\S+$/.exec(element.value.slice(0, caret.end));
	    var first = /^\S+/.exec(element.value.slice(caret.end, element.value.length))
	    var word = (last ? last[0] : "") + (first ? first[0] : "");
	    if (textWordOnly) word = word.match(/\b(.+?)\b/i)[0];

	    return (word);
	  }
	  catch
	  {
	  	return null;
	  }
	},

	getParamNames(func) {
		var STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/mg;
		var ARGUMENT_NAMES = /([^\s,]+)/g;	  var fnStr = func.toString().replace(STRIP_COMMENTS, '');
	  	var result = fnStr.slice(fnStr.indexOf('(')+1, fnStr.indexOf(')')).match(ARGUMENT_NAMES);
	  	if(result === null)
	  	   result = [];
	  	return result;
	},

	getFirstProperty: (object) => {
		var key = Object.keys(object)[0];
		var value = object[key];
		return {key:key, value:value};
	},

	getPropertyKeyOrText: (prop) => {
		if (!prop) return null;
		if (typeof(prop) == "string") return prop;
		return util.getFirstProperty(prop).key;
	},

	wait: (ms) => {
    	return new Promise(resolve => setTimeout(resolve, ms));
	},

	  date: {
	  	timeAgo: (date) => {
			  var seconds = Math.floor((new Date() - date) / 1000);

			  var interval = seconds / 31536000;

			  if (interval > 1) {
			    return Math.floor(interval) + " years";
			  }
			  interval = seconds / 2592000;
			  if (interval > 1) {
			    return Math.floor(interval) + " months";
			  }
			  interval = seconds / 86400;
			  if (interval > 1) {
			    return Math.floor(interval) + " days";
			  }
			  interval = seconds / 3600;
			  if (interval > 1) {
			    return Math.floor(interval) + " hours";
			  }
			  interval = seconds / 60;
			  if (interval > 1) {
			    return Math.floor(interval) + " minutes";
			  }
			  return Math.floor(seconds) + " seconds";
	  	}
	  },

    number: {
    	commas: (number) => parseInt(number||"0").toString().replace(/\B(?=(\d{3})+(?!\d))/g, ","),
		friendly: (number, decPlaces) => {
		    // 2 decimal places => 100, 3 => 1000, etc
		    decPlaces = Math.pow(10,decPlaces);

		    // Enumerate number abbreviations
		    var abbrev = [ "k", "m", "b", "t" ];

		    // Go through the array backwards, so we do the largest first
		    for (var i=abbrev.length-1; i>=0; i--) {

		        // Convert array index to "1000", "1000000", etc
		        var size = Math.pow(10,(i+1)*3);

		        // If the number is bigger or equal do the abbreviation
		        if(size <= number) {
		             // Here, we multiply by decPlaces, round, and then divide by decPlaces.
		             // This gives us nice rounding to a particular decimal place.
		             number = Math.round(number*decPlaces/size)/decPlaces;

		             // Handle special case where we round up to the next abbreviation
		             if((number == 1000) && (i < abbrev.length - 1)) {
		                 number = 1;
		                 i++;
		             }

		             // Add the letter for the abbreviation
		             number += abbrev[i];

		             // We are done... stop
		             break;
		        }
		    }
		    return number;
   		},
	},


	handlebars: function(object, template) {
      var templ = Handlebars.compile(template);
      var result = templ(object);
      return result;
	},

	alertify: (msg) => {
		if (!msg) return;
		if (typeof(msg) == "string") alertify.message(msg);

        if (msg.message) alertify.message (util.string.toAlert(msg.message));
        if (msg.success) alertify.success (util.string.toAlert(msg.success));
        if (msg.warning) alertify.warning (util.string.toAlert(msg.warning));
        if (msg.error) alertify.error (util.string.toAlert(msg.error));
	},

	string: {
		format: (str, ...args) => {
			for (var i = 0; i < args.length; i++)
			{
				str = str.replace(`${i}`, args[i]);
			}
			return str;
		},
		jsObjToParams: (obj) => {
			obj = Object.keys(obj).map(a => { return {key:a, value:obj[a]}});
			var obj2 = obj.map(a => `${a.key}:${(a.value)}`);
			var str = obj2.join(", ");
			return str;
		},
		toAlert: (obj) => {
			if (!obj) return null;
			if (typeof(obj) == "string") return obj;
			return JSON.stringify(obj);
		},
		isEmptyOrSpaces: (str) => {
	    	return str === null || str.match(/^ *$/) !== null;
		},
		removeEmptyLines: (str) => {
			if (!str) return str;
			str =  str
				.split("\n")
				.map(a => util.string.isEmptyOrSpaces(a) ? "" : a)
				.join("\n");
			var lines = [];
			str.split("\n").forEach(a => { if (!util.string.isEmptyOrSpaces(a)) lines.push(a); });
			return lines.join("\n");
		},
		html:
		{
			encode: (str) => str.replace(/[\u00A0-\u9999<>\&]/g, (i) => '&#'+i.charCodeAt(0)+';')
		}
	},

	html: {
		escape: (unsafe) => {
			return unsafe
	         .replace(/&/g, "&amp;")
	         .replace(/</g, "&lt;")
	         .replace(/>/g, "&gt;")
	         .replace(/"/g, "&quot;")
	         .replace(/'/g, "&#039;");
		},
		svg: {
			line: (x1, y1, x2, y2, strokeColor, strokeWidth) => {
				var newLine = document.createElementNS('http://www.w3.org/2000/svg','line');
				newLine.setAttribute('x1',x1);
				newLine.setAttribute('y1',y1);
				newLine.setAttribute('x2',x2);
				newLine.setAttribute('y2',y2);
				newLine.setAttribute("stroke", strokeColor);
				newLine.setAttribute("stroke-width", strokeWidth);
				newLine.setAttribute("style", `stroke:${strokeColor}; stroke-width:${strokeWidth}`);
				return $(newLine);
			},
			moveLine: (id, x1, y1, x2, y2) => {
			  var line = document.getElementById(id);
			  line.setAttribute('x1',x1);
			  line.setAttribute('y1',y1);
			  line.setAttribute('x2',x2);
			  line.setAttribute('y2',y2);
			  console.log(y2);
			}
		},
		iframe: {
			setContent: (iframe, html) => {
		        iframe.contentWindow.document.open();
		        iframe.contentWindow.document.close();

		        window.setTimeout(() => {
		          iframe.contentWindow.document.write(html);
		        }, 200);
			}
		},
		to: {
			table: (arr) => {
				if (!arr) return arr;
				//arr = ko.mapping.toJS(arr);
				if (Array.isArray(arr))
				{
					if (arr.length == 0) return "[]";
					//if (typeof(arr[0]) != "object") return JSON.stringify(arr);
				}
				if ((typeof(arr) != "object") && (!Array.isArray(arr))) return JSON.stringify(arr);
				if (!Array.isArray(arr)) return util.html.to.verticalTable(arr);
				if (!arr.length) return arr;

				if ((arr.length <=3) && (typeof(arr[0]) != "object")) return JSON.stringify(arr);

				var s = "<table>"

				if (typeof(arr[0]) == "object")
				{
					s += "<thead>";
					var cols = Object.keys(arr[0])
						.filter((key,i) => typeof(arr[0][key]) != "function")
						//.filter((key,i) => (arr[0][key]) && (!arr[0][key]["__proto__"]))
						;
					cols = cols.sort((a,b) => {
						var priorities = ["ImageID", "DisplayName", "Text", "TotalVotesScore"];
						if (priorities.find(c => c == b)) return 1;
						if (priorities.find(c => c == a)) return -1;
						return 0;
					});
					if (cols.length > 10) cols.length = 10;

          s += `<th></th>`;
					for (var i = 0; i < cols.length; i++)
					{
						s += `<th>${cols[i]}</th>`;
					}
					s += "</thead>";
				}
				s += "<tbody>";
				for (var i = 0; i < arr.length; i++)
				{
					var obj = arr[i];
					if (Array.isArray(obj))
					{
						s += `<tr><td>${i}.</td><td>${util.html.visualize(obj)}</td></tr>`;
					}
					if (typeof(obj) != "object")
					{
						s += `<tr><td>${i}.</td><td>${obj}</td></tr>`;
						continue;
					}
					s += "<tr>";
					s += `<td>${i}.</td>`;
					for (var j = 0; j < cols.length; j++)
					{	
						var value = obj[cols[j]];

						// *** MemeGenerator ***
						if (cols[j] == "ImageID")
						{
							value = `https://memegenerator.net/img/images/60x60/${value}.jpg`;
						}
						// *** /MemeGenerator ***

						if ((typeof(value) == "string"))
						{
							if (value.length > 80) value = value.substr(0, 80);
						}
						if ((typeof(value)=="string") && ((value.indexOf(".jpg") != -1) || (value.indexOf(".jpeg") != -1)))
							{
								value = `<img src="${value}"></img>`;
								s += `<td>${value}</td>`;
							}
							else
							{
								s += `<td>${util.html.visualize(value)}</td>`;
							}
			    	}
			    	s += "</tr>";
			    }
				s += "</tbody>";
				s += "</table>";
				return s;
			},
			verticalTable: (obj) => {
				var s = "<table>"

				var cols = Object.keys(obj).filter((key,i) => typeof(obj[key]) != "function");
				cols = cols.sort((a,b) => {
					var priorities = ["ImageID", "DisplayName"];
					if (priorities.find(c => c == b)) return 1;
					if (priorities.find(c => c == a)) return -1;
					return 0;
				});
				if (cols.length > 6) cols.length = 6;

				s += "<tbody>";
				for (var i = 0; i < cols.length; i++)
				{
					var value = obj[cols[i]];
					var valueStr = ((value || "").toString());
					try
					{
						valueStr = JSON.stringify(value);
					  valueStr = `${util.html.visualize(obj[cols[i]])}`;
					}
					catch (ex) {}
					s += "<tr>";
					s += `<th>${cols[i]}</th><td>${valueStr}</td>`;
		    	s += "</tr>";
		    }
				s += "</tbody>";
				s += "</table>";
				return s;
			}
		},
		visualize: (obj) => {
			if (!obj) return obj;
			if (Array.isArray(obj) && (obj.length == 0)) return "[]";
			if (typeof(obj) == "string")
			{
				return util.html.escape(obj);
			}
			//if (obj.toString() != "[object Object]") return obj.toString();
			if (obj.tagName) return obj.tagName;
			//obj = ko.mapping.toJS(obj);
			return util.html.to.table(obj);
			return JSON.stringify(obj, null, 1);
		}
	},

	haml: function(s) {
		if (!s) return null;
		s = util.string.removeEmptyLines(s);
		s = s
		  .replace(/{{{/g, "[[[")
		  .replace(/}}}/g, "]]]")
		  .replace(/{{/g, "[[")
		  .replace(/}}/g, "]]")
		  ;

		s = HAML.render(s);

		s = s
		  .replace(/\[\[\[/g, "{{{")
		  .replace(/\]\]\]/g, "}}}")
		  .replace(/\[\[/g, "{{")
		  .replace(/\]\]/g, "}}")
		  ;

		return s;
	},

	fetchJSON: async function(url) {
		alertify.message(`fetching ${url}`);
		var shortUrl = url;
		if (shortUrl.length > 20) shortUrl = `${shortUrl.substr(0, 20)}...`;
		console.log(`fetching`, url);
		var res = await fetch(url);
		var json = await res.text();
		return JSON.parse(json);
	}
};



if (typeof(Handlebars) != "undefined")
{
	Handlebars.registerHelper("replace", function(str, a, b) {
		  str = str.replaceAll(a, b);
	    return str;
	});


	Handlebars.registerHelper("iftype", function(value, type, options) {
	  if (typeof(value) == type) {
	    return options.fn(this);
	  }
	});


	Handlebars.registerHelper("if-endsWith", function(str, str2, options) {
		if (!str) return false;
	  if (str.endsWith(str2)) {
	    return options.fn(this);
	  }
	});


	Handlebars.registerHelper("check", function(value, comparator) {
	    return (value === comparator) ? 'No content' : value;
	});


	Handlebars.registerHelper("inc", function(number, delta) {
		var num = (parseInt(number) + parseInt(delta));
		return num;
	});


	Handlebars.registerHelper("escape", function(text) {
	  var result = Handlebars.escapeExpression(text.replace(/\n/, "\\n"));
	  return new Handlebars.SafeString(result);
	});

	Handlebars.registerHelper("untitleize", function(text) {
		if (!text) return null;
	  var result = (text.untitleize());
	  return new Handlebars.SafeString(result);
	});


	Handlebars.registerHelper("json", function(obj, encodeHtml) {
		if (!obj) return "null";
	  var str = JSON.stringify(obj);
	  //if (encodeHtml && str) str = str.replace(/{/g, "\{\[").replace(/}/g, "\]\}");
	  if (encodeHtml && str) str = encodeURI(str);
	  return new Handlebars.SafeString(str);
	});

	Handlebars.registerHelper("yaml", function(obj, encodeHtml) {
		if (!obj) return "null";
	  var str = jsyaml.dump(obj);
	  return new Handlebars.SafeString(str);
	});

	Handlebars.registerHelper("safeString", function(str) {
	  return new Handlebars.SafeString(str || "");
	});

	Handlebars.registerHelper("indent", function(str, indent) {
	  return new Handlebars.SafeString(util.indent((str || ""), indent, 1));
	});

	Handlebars.registerHelper("handlebars", (obj, templ) => {
		return new Handlebars.SafeString(util.handlebars(obj, templ));
	});


	Handlebars.registerHelper("encodeURI", (str) => {
		if (!str) return "";
		return new Handlebars.SafeString(encodeURI(str));
	});


	Handlebars.registerHelper("unlessEquals", function(a, b, options) {
		if (a == b) return null;
	  return new Handlebars.SafeString(options.fn(this));
	});
}



if (typeof(ko) != "undefined")
{
	ko.bindingHandlers.visibility = (function() {
	    function setVisibility(element, valueAccessor) {
	        var visibility = ko.unwrap(valueAccessor());
	        $(element).css('visibility', visibility ? 'visible' : 'hidden');
	    }
	    return { init: setVisibility, update: setVisibility };
	})();


	ko.bindingHandlers.wordAtCaret = {
	    init: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
			$(element).on("keyup click", function () {
				var value = valueAccessor();
				value(util.getWordAtCaret(this));
			});
	    },
	    update: function(element, valueAccessor, allBindings, viewModel, bindingContext) {
	    }
	};


	ko.bindingHandlers.iframeContent = {
	    update: function(element, valueAccessor) {
	        var value = ko.unwrap(valueAccessor());
	        element.contentWindow.document.open(); // Clear the content
	        element.contentWindow.document.close(); // Clear the content

	        window.setTimeout(() => {
	          element.contentWindow.document.write(value);
	        }, 200);
	    }
	};


	ko.bindingHandlers.visibleSlide = {
	    init: function(element, valueAccessor) {
	        // Initially set the element to be instantly visible/hidden depending on the value
	        var value = valueAccessor();
	        $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
	    },
	    update: function(element, valueAccessor) {
	        // Whenever the value subsequently changes, slowly fade the element in or out
	        var value = valueAccessor();
	        ko.unwrap(value) ? $(element).slideDown() : $(element).slideUp();
	    }
	};


	//connect items with observableArrays
	  ko.bindingHandlers.sortableList = {
	      init: function(element, valueAccessor) {
	          var list = valueAccessor();
	          $(element).sortable({
	              update: function(event, ui) {
	                  //retrieve our actual data item
	                  var item = ko.dataFor(ui.item[0]);
	                  //figure out its new position
	                  var position = ko.utils.arrayIndexOf(ui.item.parent().children(), ui.item[0]);
	                  //remove the item and add it back in the right spot
	                  if (position >= 0) {
	                      list.remove(item);
	                      list.splice(position, 0, item);
	                      valueAccessor(list);
	                  }
	              }
	          });
	      }
	  };



	ko.components.register("checkbox", {
	    viewModel: function(params) {
	    	this.id = util.getNewID();
	        this.label = params.label;
	        
	        this.checked = params.checked;
	    },
	    template:
	        '<div>\
	            <input type="checkbox" data-bind="attr: {id: id}, checked: checked" />\
	            <label data-bind="text: label, attr: {for:id}"></label>\
	        </div>'
	});



	ko.components.register("ko-list", {
	  viewModel: function(params) {
	    this.koList = params.koList;
	    this.filter = params.filter;
	    this.template = params.template;
	    this.click = params.click;

	    this.getItems = ko.computed(() => {
	      var items = Enumerable.from(this.koList.items());
	      if (this.filter) items = items.where(this.filter);
	      items = items.orderBy(a => a.name());
	      items = items.toArray();
	      return items;
	    });
	  },
	  template:
	util.haml(`\
	%div{"data-bind": "with: koList"}\n\
	  %ul.menu{"data-bind": "foreach: $parent.getItems()"}\n\
	    %li{"data-bind": "css: { selected: ($parent.selected() == $data) }, click: $parents[1].click"}\n\
	      %div{"data-bind": "if: !$parents[1].template"}
	        %div{"data-bind": "text: (name ? ko.toJS(name) : null) || JSON.stringify(ko.toJS($data))"}
	      %div{"data-bind": "if: $parents[1].template"}
	        %div{"data-bind": "template: $parents[1].template"}
	`)
	});

}




Array.prototype.except = function(item) {
	return this.filter(a => (a != item));
}

Array.prototype.remove = function(item) {
	var index = this.findIndex(a => (a == item));
	if (index == -1) return false;
	this.splice(index, 1);
	return true;
}




String.prototype.matchAllRegexes = function(regex) {
	if (!regex) throw "regex is empty.";
	regex = new RegExp(regex, "g");

  var items = [];

  var m;
	do
	{
		m = regex.exec(this);
		if (m) items.push(m);
	}
	while ((m) && (items.length < 10));

	return items;
}


String.prototype.capitalize = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
}

String.prototype.titleize = function() {
    var string_array = this.split(' ');
    string_array = string_array.map(function(str) {
       return str.capitalize(); 
    });
    
    return string_array.join(' ');
}

String.prototype.kebabize = function() {
	var str = this;

    let subs = []
    let char = ''
    let j = 0

    for( let i = 0; i < str.length; i++ ) {

        char = str[i]

        if(str[i] === char.toUpperCase()) {
            subs.push(str.slice(j, i))
            j = i
        }

        if(i == str.length - 1) {
            subs.push(str.slice(j, str.length))
        }
    }

    var s = subs.map(el => (el.charAt(0).toLowerCase() + el.substr(1, el.length))).join('-');

    if (s.startsWith("-")) s = s.substr(1);

    return s;
}

String.prototype.untitleize = function () {
  return `${this[0].toLowerCase()}${this.substr(1)}`;
}





var persisted = {};

persisted.namespace = {
	set: (value) => {
		if (value == "null")
		{
			console.log(`Error - persisted namespace value is the string "null".`);
			value = null;
		}
		if (!value)
		{
			console.log(`Persisted namespace cannot be set to ${value}.`);
			return;
		}
		persisted._internal.namespace = value;
		console.log(`Persisted namespace set to`, value);
	}
};


if (typeof(ko) != "undefined")
{

	persisted.storage = {};

	persisted.storage.errors = ko.observableArray();

	persisted.storage.set = {
		local: () => persisted._internal.storage.current = new persisted._internal.storage.Local(),
		database: (host, database) => persisted._internal.storage.current = new persisted._internal.storage.Database(host, database)
	};

	persisted._internal = {
		namespace: null,

		storage: {
			current: null,
			Local: function() {
				this.get = async (key) => JSON.parse(localStorage.getItem(key));
				this.set = async (key, value) => localStorage.setItem(key, JSON.stringify(value));
			},
			Database: function(host, database) {
				this.db = new anat.dev.DatabaseProxy(host, database);
				this.db.on.error.push((error) => { persisted.storage.errors.push(error); })
				this.get = async (key) => await this.db.store.get(key);
				this.set = async (key, value) => await this.db.store.set(key, value);
			}
		},

		items: [],

		observable: function(constructor, name, defaultValue)
		{
			if (!persisted._internal.storage.current) throw "use persisted.storage.set.local() or .database(host, database) first.";
			if (!persisted._internal.namespace) throw "use persisted.namespace.set()";

			var key = `Persisted.Observable.${persisted._internal.namespace}.${name}`;
			var obs = constructor();

			obs.subscribe(async (value) => await persisted._internal.storage.current.set(key, value));

			window.setTimeout(async () => obs((await persisted._internal.storage.current.get(key)) || defaultValue), 1);

			return obs;
		},

		ObjectCollection: function(name, getNewItem)
		{
			if (!persisted._internal.namespace) throw "use persisted.namespace.set";

			var key = `Persisted.ObservableArray.${persisted._internal.namespace}}.${name}`;

			this.getNewItem = getNewItem;

			this.items = ko.observableArray([]);

			this.count = ko.computed(() => this.items().length);

			this.jsItems = ko.computed(() => {
				return ko.toJS(this.items());
			});

			this.jsItems.subscribe(async (value) => {
				await persisted._internal.storage.current.set(key, value);
			});

			var toClass = (data) => {
				var obj = this.getNewItem();
				var keys = Object.keys(data);
				for (var i = 0; i < keys.length; i++)
				{
					var key = keys[i];
					if (obj[key]) obj[key](data[key]);
				}
				return obj;
			};

			this.reverse = () => Enumerable.from(this.items()).reverse().toArray();

			this.push = (item) => this.items.push(item);

			this.addNewItem = () => {
				var item = ko.mapping.fromJS(this.getNewItem());
				this.items.push(item);
				return item;
			}

			this.remove = (item) => {
				this.items.remove(item);
			};

			this.removeAt = (index) => {
				this.items.splice(index, 1);
				var arr = this.items();
				this.items([]);
				this.items(arr);
			};

			this.clear = () => this.items([]);

			this.init = async() => {
				if (!persisted._internal.storage.current) throw "Use persisted.storage.set (.local() or database(...)).";

				var saved = await persisted._internal.storage.current.get(key);
				if (saved)
				{
					try
					{
						if (typeof(saved) == "string")
						{
							this.items(JSON.parse(saved).map(a => toClass(a)));
						}
						else
						{
							this.items(saved.map(a => toClass(a)));
						}
					}
					catch (ex)
					{
						console.log("Error parsing: ", saved);
						throw ex;
					}
				}
			}

	  	}
	};

	persisted.observable = (name, defaultValue) => {
		var obj = persisted._internal.observable(() => ko.observable(), name, defaultValue);
		persisted._internal.items.push(obj);
		return obj;
	}

	persisted.observableArray = (name, getNewItem) => {
		var obj = new persisted._internal.ObjectCollection(name, getNewItem);
		obj.init();
		persisted._internal.items.push(obj);
		return obj;
	}

}



function IndentedString(indent)
{
	this.indent = (indent || 0);
	this.items = [];

	this.add = (s) => this.items.push(util.indent(s, this.indent, 2, false));

	this.inc = () => this.indent++;
	this.dec = () => this.indent--;

	this.value = () => this.items.join("\n");
}



function TaskQueue()
{
	this.delay = 1;
	this.wait = 100;
	this.feedbackInterval = 1000;

  this.total = ko.observable(0);
	this.count = ko.observable(0);

	this.isWorking = ko.observable(true);
	this.summary = {};
	this.summary = ko.computed(() => {
		if (!this.count()) return null;
		return `Tasks ${this.isWorking() ? "working" : "stopped"} (${util.number.commas(this.count())})`;
	}).extend({rateLimit:300});

	this.items = [];

	this.on = {
	  executed: []
	}

  this.work = () => {
  	if (!this.isWorking()) return false;
  	if (!this.items.length)
  	{
  		this.total(0);
  		return false;
  	}

  	var item = this.items.shift();
		this.count(this.count() - 1);

  	var value;

  	try
  	{
  		value = item();
  	}
  	catch (ex)
  	{
  		this.isWorking(false);
  		console.log(ex);
  		console.log(item);
  		debugger;
  		alertify.error(`Task queue stopped: ${ex.toString()}`);
  		throw ex;
  	}

  	this.on.executed.forEach(a => a({item: item, value: value}));

  	return true;
  }

  this.stop = () => {
  	this.isWorking(false);
  }
  this.start = () => {
  	this.isWorking(true);
  	this.worker();
  }
  this.clear = () => {
  	this.items = [];
  	this.count(0);
  }
  this.restart = () => {
  	this.clear();
  	window.setTimeout(this.start, 1000);
  }

  this.worker = () => {
  	var delay = this.work() ? this.delay : this.wait;

  	window.setTimeout(this.worker, delay);
  }

  this.addTask = (item, callback) => {
  	this.total(this.total() + 1);
		this.count(this.count() + 1);

  	if (!callback)
  	{
  		this.items.push(item);
  		return;
  	}

  	var handler;
  	handler = (result) => {
  		if (result.item == item)
  		{
  			this.on.executed = this.on.executed.filter(a => (a == handler));
  			callback(result.value);
  		}
  	};

  	this.on.executed.push(handler);

  	this.items.push(item);
  }

  this.showFeedback = () => {
  	if (this.items.length)
  	{
  		alertify.warning(`${this.items.length} tasks in queue.`);
  	}
		window.setTimeout(this.showFeedback, this.feedbackInterval);
  }
  //this.showFeedback();
  this.worker();
}



function ActionStack(execute, callback, persistedName, autoExecute)
{
  this.tasks = new TaskQueue();

	this.callFunction = (func) => func();
	this.execute = (execute || this.callFunction);
	this.persistedName = persistedName;

	if (this.persistedName)
	{
  	this.pointer = persisted.observable(`${persistedName}.pointer`, -1);
		this._items = persisted.observable(`${persistedName}.items`, []);

  	this.loaded = {
  		items: false,
  		pointer: false
  	};

  	var subscription1 = this._items.subscribe(() => {
  		subscription1.dispose();
  		this.loaded.items = true;
  	});

  	var subscription2 = this.pointer.subscribe(() => {
  		subscription2.dispose();
  		this.loaded.pointer = true;
  	});

  	var check = () => {
  		if (this.loaded.items && this.loaded.pointer)
  		{
  			if (autoExecute)
  			{
					var pointer = this.pointer();
					this.pointer(-1);
  				this.doUntil(pointer);
			  }
		  	else
		  	{
		  		this.pointer(-1);
		  	}
  		}
  		else
  		{
  			window.setTimeout(check, 100);
  		}
  	};

		check();
	}
	else
	{
		this.pointer = ko.observable(-1);
		this._items = ko.observableArray();
	}
	this.items = () => {
		return (this._items());
	}
	this.count = ko.computed(() => this.items() ? this.items().length : 0);

	this.delayed = {
		pointer: ko.computed(() => (this.pointer() || 0)).extend({rateLimit:300}),
		count: ko.computed(this.count).extend({rateLimit:300}),
		items: ko.computed(() => Enumerable.from(this._items()).take(30).toArray()).extend({rateLimit:300})
	};

  this.enabled = ko.computed(() => {
  	if (this.tasks.count() > 0) return false;
  	if ((this.count() - this.pointer()) > 10) return false;
  	return true;
  });

	this.addItem = (item) => {
		if (!this.persistedName)
		{
			this._items.push(item);
		}
		else
		{
			this._items().push(item);
			this._items(this._items());
		}
	}

	this.summary = ko.computed(() => {
		try
		{
			var s = [];
			var index = this.pointer();
			if (index >= 0) s.push(this.items()[index].description);
			s.push(`(${index})`);
			return s.join(" ");
		}
		catch (ex)
		{
			return ex.toString();
		}
	});

	this.callback = callback;


	this.clear = () => {
		alertify.confirm(`Clear ${this._items().length} items?\nThis cannot be undone, you'll have to redo all the actions manually.`, () => {
		  this.pointer(-1);
		  this._items([]);
		  alertify.alert("All items cleared.");
		});
	}


	this.save = () => {
		var data = {
			pointer: this.pointer(),
			items: this.items()
		};
		data = JSON.stringify(data);
		var filename = `${(new Date())}.json`;
		var type = "application/json";
		util.download(data, filename, type);
	}

	this.load = (data) => {
		alertify.confirm(`Load the data from the text box?\nThis cannot be undone.`, () => {
    	if ((typeof(data) == "string")) data = JSON.parse(data);
    	this.pointer(-1);
    	this._items(data.items);
		});
	}


	this.do = (description, redo, undo) => {
		if (!this.enabled())
		{
			alertify.warning(`No performing action: action stack is disabled.`);
			return;
		}

		var result = this.tasks.addTask(() => this.execute(redo), () => {
			if (!undo) undo = result;
			this._items(this.items().slice(0, this.pointer() + 1));
			this.addItem({ description: description, redo: redo, undo: undo });
			this.pointer(this.pointer() + 1);

			if (this.callback) callback();
		});
	}

	this.can = {
		undo: () => (this.pointer() > -1),
		redo: () => (this.pointer() < (this.count() - 1))
	};

	this.undo = () => {
		if (!this.can.undo())
		{
			alertify.warning("No more actions to undo.");
			return;
		}

    var item = this.items()[this.pointer()];
    this.pointer(this.pointer() - 1);

    try
    {
  	  this.tasks.addTask(() => this.execute(item.undo));
  	}
  	catch (ex)
  	{
  		console.log(`Error: ${ex.toString()}`);
  		console.log(item.undo);
  		throw ex;
  	}
		if (this.callback) callback();
	}

	this.redo = () => {
		if (!this.can.redo())
		{
			alertify.warning("No more actions to redo.");
			return;
		}

    this.pointer(this.pointer() + 1);
    var item = this.items()[this.pointer()];

    try
    {
  	  this.tasks.addTask(() => this.execute(item.redo));
  	}
  	catch (ex)
  	{
  		console.log(`Error: ${ex.toString()}`);
  		console.log(item.redo);
  		throw ex;
  	}
	  if (this.callback) callback();
	}

  this.doUntil = async (index) => {
  	if (this.pointer() > index)
  	{
  		while (this.pointer() > index)
  		{
  			this.undo();
  		}
  	}
  	else
  	{
  		this.tasks.stop();

  		var func;
  		func = () => {
  			this.redo();

  			if (this.pointer() < index)
  			{
  				window.setTimeout(func, 1);
  			}
  			else
  			{
  				this.tasks.start();
  			}
  		}
  		func();
  	}
  }
}





function ActionStack2(execute)
{
	this.callFunction = (func) => func();
	this.execute = (execute || this.callFunction);
	this.pointer = ko.observable(-1);
	this.items = ko.observableArray();
	this.count = ko.computed(() => this.items().length);

	this.summary = ko.computed(() => {
		var s = [];
		if (this.pointer() >= 0) s.push(this.items()[this.pointer()].description);
		s.push(`(${this.pointer()})`);
		return s.join(" ");
	});


	this.do = (description, redo) => {
		this.execute(redo);
		this.items(this.items().slice(0, this.pointer() + 1));
		this.items.push({ description: description, redo: redo });
		this.pointer(this.pointer() + 1);

		if (this.callback) callback();
	}

	this.can = {
		undo: () => (this.pointer() > -1),
		redo: () => (this.pointer() < (this.items().length - 1))
	};

	this.undo = () => {
		if (!this.can.undo())
		{
			alertify.warning("No more actions to undo.");
			return;
		}

		this.execute("clear");

		for (var i = 0; i < this.pointer(); i++)
		{
      var item = this.items()[i];
      this.execute(item.redo);
		}
    this.pointer(this.pointer() - 1);
    //alertify.message(`Undo:\n${item.description}`);
	}

	this.redo = () => {
		if (!this.can.redo())
		{
			alertify.warning("No more actions to redo.");
			return;
		}

    this.pointer(this.pointer() + 1);
    var item = this.items()[this.pointer()];
    this.execute(item.redo);
    alertify.message(`Redo:\n${item.description}`);
	}
}




if (typeof(jQuery) != "undefined")
{

	(function($){
		$.fn.toggleVisibility = function(isVisible) {
		    if (isVisible) this.show(); else this.hide();
		};
	})(jQuery);



	(function($){
	    $.fn.absOffset = function(pos)
	    {
	    	  if (pos)
	    	  {
	    	  	this.css("position", "absolute");
	    	  	this.offset(pos);
	    	  	return;
	    	  }

	        var rect = this.get(0).getBoundingClientRect();   
	        return {top: Math.round(rect.top), left: Math.round(rect.left)};
	    };
	})(jQuery);





	(function($){
	    $.fn.getStyleObject = function(){
	        var dom = this.get(0);
	        var style;
	        var returns = {};
	        if(window.getComputedStyle){
	            var camelize = function(a,b){
	                return b.toUpperCase();
	            };
	            style = window.getComputedStyle(dom, null);
	            for(var i = 0, l = style.length; i < l; i++){
	                var prop = style[i];
	                var camel = prop.replace(/\-([a-z])/g, camelize);
	                var val = style.getPropertyValue(prop);
	                returns[camel] = val;
	            };
	            return returns;
	        };
	        if(style = dom.currentStyle){
	            for(var prop in style)
	            {
	                returns[prop] = style[prop];
	            };
	            return returns;
	        };
	        return this.css();
	    }
	})(jQuery);



}