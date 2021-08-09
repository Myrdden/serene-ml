import { Effect, Cleanup, Signal, omit } from '/node_modules/reactive/reactive.js';
import { kebab, isPlain, ElementNames } from './util.js';
import reconcile from './reconcile.js';

const Utilities = new Map();

Utilities.set('isElementName', (x) => ElementNames.has(x));

const Events = new Map();
const CapturedEvents = new Map();

Utilities.set('hasEvent', (elem, event) => { const map = Events.get(event); return (map != null && map.has(elem)); });
Utilities.set('hasCapturedEvent', (elem, event) => { const map = CapturedEvents.get(event); return (map != null && map.has(elem)); });
Utilities.set('hasAnyEvent', (elem, event) => {
	let map = Events.get(event);
	if (map != null && map.has(elem)) { return true; }
	map = CapturedEvents.get(event);
	return (map != null && map.has(elem));
});

const prop = (elem, key, val, isCss) => {
	const type = typeof val;
	if (key === '$') {
		connect(elem, val);
	} else if (key[0] === 'o' && key[1] === 'n') {
		let event = key.slice(2).toLowerCase(), captured = false;
		if (event.startsWith('captured')) { captured = true; event = event.slice(8); }
		if (type === 'function' || val != null) {
			const from = captured ? CapturedEvents : Events;
			let map = from.get(event);
			if (map == null) {
				if (type === 'function') {
					map = new Map(); map.set(elem, val); from.set(event, map);
					elem.addEventListener(event, val, captured);
				}
			} else {
				const handler = map.get(elem);
				if (handler != null) { elem.removeEventListener(event, handler, captured); }
				if (type === 'function') { elem.addEventListener(event, val, captured); map.set(elem, val); }
				else { map.delete(elem); (!map.size) && from.delete(event); }
			}
		}
	} else if (key === 'ref') {
		type === 'function' && val(elem);
	} else if (type === 'function') {
		Effect(() => prop(elem, key, val(), isCss));
	} else if (isCss) {
		elem.style[key] = val;
	} else if (key === 'style' || key === 's') {
		if (type === 'string') { elem.style.cssText = val; }
		else if (isPlain(val)) {
			for (var style in val) { prop(elem, style, val[style], true); }
		} else if (val == null) { elem.removeAttribute('style'); }
		else { throw 'style attribute must be string, null or plain object'; }
	} else if (key === 'class' || key === 'c') {
		if (type === 'string') { elem.className = val; }
		else if (Array.isArray(val)) {
			const classes = [], bump = new Signal(true);
			for (let i = 0, len = val.length; i !== len; i++) {
				if (typeof val[i] === 'function') {
					const fn = val[i];
					Effect((last) => {
						let temp = fn; while (typeof temp === 'function') { temp = temp(); }
						classes[i] = (temp != null ? (String(temp) + ((i === len - 1) ? '' : ' ')) : '');
						(last != null) && bump(true);
						return classes[i];
					});
				} else { classes[i] = (val[i] != null ? (String(val[i]) + ((i === len - 1) ? '' : ' ')) : ''); }
			}
			Effect(() => (bump(), (elem.className = classes.join(''))));
		} else { throw 'class attribute must be a string, a function returning a string, or an array of strings or functions returning strings.'; }
	}
	else if (key === 'value') { elem.value = val; }
	else { !val ? elem.removeAttribute(kebab(key)) : elem.setAttribute(kebab(key), val); }
	return val;
}

const make = (elem, args) => {
	if (args.length === 0) { return elem; }
	let solo = true;
	if (args.length !== 1) {
		for (let i = args.length; i--;) { if (!isPlain(args[i])) { if (solo === null) { solo = false; break; } else { solo = null; } } }
		solo === null && (solo = true);
	}
	for (let i = 0, len = args.length; i !== len; i++) { el(elem, args[i], solo); }
	return elem;
}

const el = (elem, val, solo) => {
	const type = typeof val;
	if (val == null || type === 'boolean') { return; }
	if (val instanceof Node) { elem.appendChild(val); }
	else if (type === 'string' || type === 'number' || val instanceof Date) {
		if (solo) { elem.textContent = type === 'string' ? val : val.toString(); }
		else { elem.appendChild(document.createTextNode(type === 'string' ? val : val.toString())); }
	} else if (type === 'function') {
		if (solo) {
			Effect((current) => reconcile(elem, null, current, val()), null);
		} else {
			let anchor, anchorType;
			// i !== len - 1 && (anchor = args[i+1], anchorType = typeof anchor);
			// if (anchorType === 'string' || anchorType === 'number' || anchor instanceof Node || anchor instanceof Date) {
			// 	el(elem, args[++i]);
			// 	anchor = elem.lastChild;
			// } else { anchor = elem.appendChild(document.createTextNode('')); }
			anchor = elem.appendChild(document.createTextNode(''));
			Effect((current) => reconcile(elem, anchor, current, val()), null);
		}
	} else if (Array.isArray(val)) {
		for (let j = 0; j !== val.length; j++) { el(elem, val[j], false); }
	} else if (Symbol.iterator in val) {
		for (let x of val) { el(elem, x, false); }
	} else if (isPlain(val)) {
		for (let key in val) { prop(elem, key, val[key]); }
	} else { throw 'Unsupported argument ' + Object.prototype.toString.call(val) + ' in ' + elem.nodeName.toLowerCase() + '.'; }
}

const html = (elem, ...args) => ElementNames.has(elem) ? make(document.createElement(elem), args) : undefined;

const h = new Proxy(html, {
	get: (target, prop) => Utilities.has(prop)
		? Utilities.get(prop)
		: ((...args) => ElementNames.has(prop) ? make(document.createElement(prop), args) : undefined),
	set: () => null,
	deleteProperty: () => null
});
export default h;

const toString = (x) => x == null ? '' : x.toString();

// Do we need the cleanups here? The context that sets up this connector goes out of scope anyways...

const connect = (elem, val) => {
	let event, on, off; const callback = val[4];
	if (Signal.is(val)) {
		event = 'input'; on = true; off = false;
	} else if (Array.isArray(val)) {
		event = val[1] || 'input'; on = val[2] != null ? val[2] : true; off = val[3] != null ? val[3] : false;
		if (!Signal.is(val[0])) { throw 'First argument of array in $ (connector) of ' + elem.nodeName.toLowerCase() + ' is not a signal.'; }
		val = val[0];
	} else { throw 'Value of $ (connector) in ' + elem.nodeName.toLowerCase() + ' should be either a signal or an array of arguments, see docs.'; }
	const input = elem instanceof HTMLInputElement;
	const type = input && elem.type.toLowerCase();
	if (input && type === 'checkbox') {
		Effect(() => elem.checked = val() === on);
		const listener = () => (val(elem.checked ? on : off, callback), true);
		elem.addEventListener('change', listener, false);
		new Cleanup(() => elem.removeEventListener('change', listener));
	} else if (input && type === 'radio') {
		Effect(() => elem.checked = val() === on);
		const listener = () => (elem.checked && val(on, callback), true);
		elem.addEventListener('change', listener, false);
		new Cleanup(() => elem.removeEventListener('change', listener));
	} else if (input || elem instanceof HTMLSelectElement || elem instanceof HTMLTextAreaElement) {
		Effect(() => elem.value = toString(val()));
		const listener = () => (toString(omit(val)) !== elem.value && val(elem.value, callback), true);
		elem.addEventListener(event, listener, false);
		new Cleanup(() => elem.removeEventListener(event, listener));
	} else if (elem.isContentEditable) {
		Effect(() => elem.textContent = toString(val()));
		const listener = () => (toString(omit(val)) !== elem.textContent && val(elem.textContent, callback), true);
		elem.addEventListener(event, listener, false);
		new Cleanup(() => elem.removeEventListener(event, listener));
	} else if (elem instanceof HTMLButtonElement) {
		const listener = () => (val(v => v === on ? off : on, callback), true);
		elem.addEventListener('click', listener, false);
		new Cleanup(() => elem.removeEventListener('click', listener));
	} else { throw 'The $ (connector) property is not supported on ' + elem.nodeName.toLowerCase() + '.'; }
}

Utilities.set('isEditable', (el) => {
	if (!el) { return false; }
	if (el.readOnly || el.disabled) { return false; }
	if (el.isContentEditable) { return true; }
	const name = el.nodeName.toLowerCase();
	return (el.nodeType === 1 && (name === 'textarea' || (name === 'input'/* && /^(?:text|date|datetime-local|email|month|number|password|search|tel|time|url|week)$/.test(el.type)*/)));
});

Utilities.set('isClickable', (el) => {
	if (!el || el.nodeType !== 1) { return false; }
	if (el.onClick != null || h.hasAnyEvent(el, 'click') || el.isContentEditable) { return true; }
	const name = el.nodeName.toLowerCase();
	if (name === 'a' && el.href != null) { return true; }
	if (name === 'label' && el.control != null) { return h.isClickable(el.control); }
	if (el.disabled || el.readOnly) { return false; }
	return (name === 'select' || name === 'option' || name === 'button' || name === 'textarea' || name === 'input');
});

Utilities.set('isYScrollable', (el) => {
	if (!el || el.nodeType !== 1) { return false; }
	if (el.scrollTopMax != null) { return (el.scrollTopMax > 0); }
	if (el == document.scrollingElement) { return el.scrollHeight > el.clientHeight; }
	return ((el.scrollHeight > el.clientHeight) && (['scroll', 'auto'].includes(window.getComputedStyle(el).overflowY)));
});

Utilities.set('isXScrollable', (el) => {
	if (!el || el.nodeType !== 1) { return false; }
	if (el.scrollLeftMax != null) { return (el.scrollLeftMax > 0); }
	if (el == document.scrollingElement) { return el.scrollWidth > el.clientWidth; }
	return ((el.scrollWidth > el.clientWidth) && (['scroll', 'auto'].includes(window.getComputedStyle(el).overflowX)));
});

Utilities.set('isScrollable', (el) => (Utilities.get('isYScrollable')(el) || Utilities.get('isXScrollable')(el)));

let lowerBound, refreshLowerBound;
Utilities.set('normalizeDelta', (e, using) => {
	let deltaY = e.deltaY * -1;
	let deltaX = e.deltaX;

	if (deltaY === 0 && deltaX === 0) { return (using ? 0 : [ 0, 0 ]); }

	if (e.deltaMode === 1 || e.deltaMode === 2) {
		const height = (e.deltaMode === 1)
			? Number(window.getComputedStyle(e.target).getPropertyValue('font-size') || 16)
			: window.innerHeight;
		(deltaX !== 0) && (deltaX *= height);
		(deltaY !== 0) && (deltaY *= height);
	}

	const abs = (deltaX == 0) ? Math.abs(deltaY) : (deltaY == 0) ? Math.abs(deltaX) : Math.max(Math.abs(deltaY), Math.abs(deltaX));
	if (!lowerBound || (abs < lowerBound)) { lowerBound = abs; }
	(deltaX !== 0) && (deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowerBound));
	(deltaY !== 0) && (deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowerBound));

	// if (this.getBoundingClientRect) {
	// 	const rect = this.getBoundingClientRect();
	// 	e.offsetX = e.clientX - rect.left;
	// 	e.offsetY = e.clientY - rect.top;
	// }

	// refreshLowerBound && clearTimeout(refreshLowerBound);
	// refreshLowerBound = setTimeout(() => (lowerBound = null), 1000);

	return ((using === 1) ? deltaY : (using === 2) ? deltaX : [ deltaX, deltaY ]);
});