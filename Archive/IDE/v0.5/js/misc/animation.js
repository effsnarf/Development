

var animation = {
    _getPosDiff: (r1, r2) => {
        return {
            x: Math.round(r2.x - r1.x),
            y: Math.round(r2.y - r1.y)
        };
    },
    _getScaleDiff: (r1, r2) => {
        return {
            x: (r2.width / r1.width),
            y: (r2.height / r1.height)
        };
    },
    _apply: (o1, o2, func) => {
        var o = {};
        Object.keys(o1).forEach(k => { o[k] = func(o1[k], o2[k]); });
        return o;
    },
    _toCssScale: (size) => {
        return `scale(${size.x}, ${size.y})`;
    },
    _toCssMove: (pos) => {
        return `translate(${pos.x}px, ${pos.y}px)`;
    },
    tween: (el, srcEl, targetEl, duration, direction) => {
        var filter = {
            enter: {
                start: {
                    blur: `1px`
                },
                end: {
                    blur: `0px`
                }
            },
            leave: {
                start: {
                    blur: `0px`
                },
                end: {
                    blur: `1px`
                }
            }
        };
        var getFilter = (stage) => Object.entries(filter[direction][stage]).map(e => `${e[0]}(${e[1]})`);
        var $el = $(el);
        var $srcEl = $(srcEl);
        var $targetEl = $(targetEl);
      
        var elRect = $el[0].getBoundingClientRect();
        var srcRect = $srcEl[0].getBoundingClientRect();
        var targetRect = $targetEl[0].getBoundingClientRect();
      
        var startPos = animation._getPosDiff(elRect, srcRect);
        var startScale = animation._getScaleDiff(elRect, srcRect);
        var endPos = animation._getPosDiff(elRect, targetRect);
        var endScale = animation._getScaleDiff(elRect, targetRect);
      
        $el.css(`transform-origin`, `0 0`);
      
        // set initial position
        $el.css(`transition`, `0s`);
        if (!$el.is(`img`)) $el.css(`filter`, getFilter(`start`));
        $el.css(`transform`, `${animation._toCssMove(startPos)} ${animation._toCssScale(startScale)}`);
      
        setTimeout(() => {
            $el.css(`transition`, `${duration}s`);
            if (!$el.is(`img`)) $el.css(`filter`, getFilter(`end`));
            $el.css(`transform`, `${animation._toCssMove(endPos)} ${animation._toCssScale(endScale)}`);
        }, 0);
      
        setTimeout(() => {
            $el.css(`transition`, `0s`);
            $el.css(`filter`, ``);
            $el.css(`transform`, ``);
        }, (duration * 1000));
    }
};

