class Tooltip {
    constructor() {
        this.createTooltipElement();
        this.fadeInTimeout = null;
    }

    createTooltipElement() {
        this.tooltipEl = document.createElement('div');
        this.tooltipEl.className = 'tooltip';
        this.tooltipEl.classList.add('tooltip-hidden'); // Initially hidden
        document.body.appendChild(this.tooltipEl);
    }

    setText(text, x, y) {
        this.tooltipEl.textContent = text;
        this.updatePosition(x, y);
    }

    _show(text, x, y) {
        this.tooltipEl.textContent = text;
        //this.tooltipEl.style.display = 'block';
        this.tooltipEl.classList.remove('tooltip-hidden');
        this.updatePosition(x, y);
    }

    show(text, x, y, delay = 1000) {
        if (this.fadeInTimeout) clearTimeout(this.fadeInTimeout);
        this.setText(text, x, y);
        this.fadeInTimeout = setTimeout(() => {
            this._show(text, x, y);
        }, delay);
    }

    hide() {
        if (this.fadeInTimeout) clearTimeout(this.fadeInTimeout);
        this.tooltipEl.classList.add('tooltip-hidden');
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
            this.tooltip.updatePosition(e.pageX + 10, e.pageY + 10); // Offset to avoid cursor overlap
        });
    }
}


// When the document loads, create a new TooltipManager
document.addEventListener('DOMContentLoaded', () => {
    //const ttm = new TooltipManager();
});