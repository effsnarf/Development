class Tooltip {
    constructor() {
        this.createTooltipElement();
        this.fadeInTimeout = null;
    }

    createTooltipElement() {
        const el = document.createElement('div');
        el.className = 'tooltip';
        el.classList.add('tooltip-hidden');
        el.style.position = "fixed";
        el.style.border = "1px solid gray";
        el.style.background = "#202020";
        el.style.padding = "0.5em 1em";
        el.style.boxShadow = "-12px 12px 5px #00000080";
        el.style.opacity = 0;
        el.style.pointerEvents = "none";
        el.style.transform = "translate(-50%, calc(-100% - 2em))";
        el.style.transition = "opacity 0.3s";
        el.style.zIndex = 10000;
        this.tooltipEl = el;
        document.body.appendChild(this.tooltipEl);
    }

    setText(text, x, y) {
        this.tooltipEl.textContent = text;
        this.updatePosition(x, y);
    }

    _show(text, x, y) {
        this.tooltipEl.textContent = text;
        this.tooltipEl.style.opacity = 1;
        this.updatePosition(x, y);
    }

    show(text, x, y, delay = 200) {
        if (this.fadeInTimeout) clearTimeout(this.fadeInTimeout);
        this.setText(text, x, y);
        this.fadeInTimeout = setTimeout(() => {
            this._show(text, x, y);
        }, delay);
    }

    hide() {
        if (this.fadeInTimeout) clearTimeout(this.fadeInTimeout);
        this.tooltipEl.style.opacity = 0;
    }

    updatePosition(x, y) {
        this.tooltipEl.style.left = `${x}px`;
        this.tooltipEl.style.top = `${y}px`;
    }
}

class TooltipManager {
    constructor(interval = 1000) {
        this.tooltip = new Tooltip();
        this.interval = interval;
        this.hookToElements();
        this.startPeriodicCheck();
        this.attachGlobalMouseMoveListener();
    }

    hookToElements() {
        const elements = document.querySelectorAll('[title]:not([data-tooltip-hooked])');
        elements.forEach(element => {
            const title = element.getAttribute('title');
            element.attributes.removeNamedItem('title');
            element.dataset.tooltipHooked = 'true';
            element.addEventListener('mouseenter', e => {
                this.tooltip.show(title);
            });
            element.addEventListener('mouseleave', () => {
                this.tooltip.hide();
            });
        });
    }

    startPeriodicCheck() {
        setInterval(() => {
            this.hookToElements();
        }, this.interval);
    }

    attachGlobalMouseMoveListener() {
        document.addEventListener('mousemove', e => {
            this.tooltip.updatePosition(e.clientX + 10, e.clientY + 10); // Offset to avoid cursor overlap
        });
    }
}


// When the document loads, create a new TooltipManager
document.addEventListener('DOMContentLoaded', () => {
    const ttm = new TooltipManager();
});