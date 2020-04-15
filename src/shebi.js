'use strict';

import getArrayOfElements from "./core/getArrayOfElements";
import { merge } from "lodash";

let defaultConfig = { debug: false };
const PACKAGE_NAME = 'shebi';
const EVENTS = {
    sticky_change: 'sticky-change',
}

class Shebi {
    /**
    * @param {String|Element|Element[]} selector
    * @param {Object} config (optional) - the object of settings to be applied to the instance
    */
    constructor(selector, config = {}) {
        this.selector = selector;
        this.config = merge(defaultConfig, config);

        this.init();
    }

    init() {
        let selectors = getArrayOfElements(this.selector);

        for (let i = 0; i < selectors.length; i++) {
            const container = selectors[i].parentElement;
            container.classList.add('sticky_sentinel--wrapper');

            this.notifyWhenStickyHeadersChange(container);
        }
    }

    /**
     * Notifies when elements w/ the `sticky` class begin to stick or stop sticking.
     * Note: the elements should be children of `container`.
     * @param {Element} container
     */
    notifyWhenStickyHeadersChange(container) {
        this.observeHeaders(container);
        this.observeFooters(container);
    }


    /**
     * Sets up an intersection observer to notify when elements with the class
     * `.sticky_sentinel--top` become visible/invisible at the top of the container.
     * @param {Element} container
     */
    observeHeaders(container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const targetInfo = entry.boundingClientRect;
                const stickyTarget = entry.target.parentElement.querySelector('.sticky');
                const rootBoundsInfo = entry.rootBounds;

                // Started sticking.
                if (targetInfo.bottom < rootBoundsInfo.top) {
                    this.fire(true, stickyTarget);
                }

                // Stopped sticking.
                if (targetInfo.bottom >= rootBoundsInfo.top &&
                    targetInfo.bottom < rootBoundsInfo.bottom) {
                    this.fire(false, stickyTarget);
                }
            });
        },
            { threshold: [0] });

        // Add the top sentinels to each section and attach an observer.
        const sentinels = this.addSentinels(container, 'sticky_sentinel--top');
        sentinels.forEach(el => observer.observe(el));
    }

    /**
     * Sets up an intersection observer to notify when elements with the class
     * `.sticky_sentinel--bottom` become visible/invisible at the bottom of the
     * container.
     * @param {Element} container
     */
    observeFooters(container) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                const targetInfo = entry.boundingClientRect;
                const stickyTarget = entry.target.parentElement.querySelector('.sticky');
                const rootBoundsInfo = entry.rootBounds;
                const ratio = entry.intersectionRatio;

                // Started sticking.
                if (targetInfo.bottom > rootBoundsInfo.top && ratio === 1) {
                    this.fire(true, stickyTarget);
                }

                // Stopped sticking.
                if (targetInfo.top < rootBoundsInfo.top &&
                    targetInfo.bottom < rootBoundsInfo.bottom) {
                    this.fire(false, stickyTarget);
                }
            });
        },
            { threshold: [1] });

        // Add the bottom sentinels to each section and attach an observer.
        const sentinels = this.addSentinels(container, 'sticky_sentinel--bottom');
        sentinels.forEach(el => observer.observe(el));
    }

    /**
     * @param {Element} container
     * @param {string} className
     */
    addSentinels(container, className) {
        return Array.from(container.querySelectorAll('.sticky')).map(el => {
            const sentinel = document.createElement('div');
            sentinel.classList.add('sticky_sentinel', className);
            sentinel.classList.toggle('sticky_sentinel--debug', this.config.debug);
            return el.parentElement.appendChild(sentinel);
        });
    }

    /**
     * Dispatches the `sticky-event` custom event on the target element.
     * @param {boolean} stuck True if `target` is sticky.
     * @param {Element} target Element to fire the event on.
     */
    fire(stuck, target) {
        const evt = new CustomEvent(EVENTS.sticky_change, { detail: { stuck, target } });
        target.dispatchEvent(evt);
    }

    /**
     * add event `handler` for event `event`
     *
     * @param {string} event the event name to bind to
     * @param {function} handler handler function for the event
     */
    on(event, handler) {
        if (!Object.values(EVENTS).includes(event) ) {
            return console.error(`${PACKAGE_NAME}: ${event} is not a event of `);
        }

        if (typeof handler !== 'function') {
            return console.error(`${PACKAGE_NAME}: expected handler to be typeof "function"`);
        }

        let selectors = getArrayOfElements(this.selector);

        for (let i = 0; i < selectors.length; i++) {
            const element = selectors[i];

            element.addEventListener(event, handler);
        }
    }

    /**
     * removes handler for the `event`
     *
     * @param {string} event then event name to remove the handler on
     */
    off(event) {
        let selectors = getArrayOfElements(this.selector);

        for (let i = 0; i < selectors.length; i++) {
            const element = selectors[i];

            element.removeEventListener(event);
        }
    }
}

function shebi(selector, settings) {
    return new Shebi(selector, settings);
}

export default shebi;
