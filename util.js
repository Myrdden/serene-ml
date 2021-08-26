export { isPlain, isPopulated } from 'serene-js';

export const repeat = (times, fn, acc) => {
	if (acc != null) { for (let i = times; i--;) { fn(i, acc); } return acc; }
	const out = []; for (let i = times; i--;) { out[i] = fn(i); } return out;
}

export const kebab = (str) => {
	const out = [];
	for (let i = 0; i < str.length; i++) { /[A-Z]/.test(str[i]) ? out.push('-', str[i].toLowerCase()) : out.push(str[i]); }
	return out.join('');
}

export const eachPair = (obj, fn, ifEmpty) => {
	if (Array.isArray(obj)) {
		if (!obj.length) { ifEmpty && ifEmpty(); return; }
		if (Array.isArray(obj[0])) {
			for (let i = 0; i !== obj.length; i++) { fn(obj[i][0], obj[i][1]); }
		} else {
			if (obj.length % 2) { throw 'odd'; }
			for (let i = 0; i < obj.length; i++) { fn(obj[i], obj[++i]); }
		}
	} else if (Symbol.iterator in Object(obj)) {
		const iterator = obj[Symbol.iterator]();
		let key = iterator.next();
		if (key.done) { ifEmpty && ifEmpty(); return; }
		const pairs = Array.isArray(key.value);
		if (Array.isArray(key.value)) {
			while (!key.done) { fn(key.value[0], key.value[1]); key = iterator.next(); }
		} else {
			let val;
			while (true) {
				val = iterator.next(); if (val.done) { break; }
				fn(key.value, val.value);
				key = iterator.next(); if (key.done) { break; }
			}
		}
	} else {
		const keys = Object.keys(obj);
		if (!keys.length) { ifEmpty && ifEmpty(); return; }
		for (let i = 0; i !== keys.length; i++) { fn(keys[i], obj[keys[i]]); }
	}
}

export const hash = (str) => {
	let h = 5381;
	for (let i = str.length; i--;) { h = (h * 33) ^ str.charCodeAt(i); }
	return (hash >>> 0).toString(36);
}

export const ElementNames = new Set([
	'a', 'abbr', 'acronym', 'address', 'applet', 'area', 'article', 'aside',
	'audio', 'b', 'base', 'basefont', 'bdi', 'bdo', 'bgsound', 'big', 'blink',
	'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'center', 'cite',
	'code', 'col', 'colgroup', 'command', 'content', 'data', 'datalist', 'dd',
	'del', 'details', 'dfn', 'dialog', 'dir', 'div', 'dl', 'dt', 'element', 'em',
	'embed', 'fieldset', 'figcaption', 'figure', 'font', 'footer', 'form',
	'frame', 'frameset', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header',
	'hgroup', 'hr', 'html', 'i', 'iframe', 'image', 'img', 'input', 'ins',
	'isindex', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'listing',
	'main', 'map', 'mark', 'marquee', 'math', 'menu', 'menuitem', 'meta',
	'meter', 'multicol', 'nav', 'nextid', 'nobr', 'noembed', 'noframes',
	'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param',
	'picture', 'plaintext', 'pre', 'progress', 'q', 'rb', 'rbc', 'rp', 'rt',
	'rtc', 'ruby', 's', 'samp', 'script', 'section', 'select', 'shadow', 'slot',
	'small', 'source', 'spacer', 'span', 'strike', 'strong', 'style', 'sub',
	'summary', 'sup', 'svg', 'table', 'tbody', 'td', 'template', 'textarea',
	'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'tt', 'u', 'ul',
	'var', 'video', 'wbr', 'xmp'
]);

export const isElementName = (name) => ElementNames.has(name)

const namedChars = {
	amp: '&', apos: "'", cent: '¢', copy: '©', euro: '€', gt: '>',
	lt: '<', nbsp: '\u00A0', pound: '£', reg: '®', quot: '"', yen: '¥'
}
export const decodeText = (str) => str.replace(/\&([^;]+);/g, (_, char) => {
	if (char in namedChars) { return namedChars[char]; }
	let match; if (match = char.match(/^#x([\da-fA-F]+)$/)) { return String.fromCharCode(parseInt(match[1], 16)); }
	if (match = char.match(/^#(\d+)$/)) { return String.fromCharCode(Number(match[1])); }
	return '';
});

export const isClickable = (el) => {
	if (!el || el.nodeType !== 1) { return false; }
	if (el.onClick != null || h.hasAnyEvent(el, 'click') || el.isContentEditable) { return true; }
	const name = el.nodeName.toLowerCase();
	if (name === 'a' && el.href != null) { return true; }
	if (name === 'label' && el.control != null) { return h.isClickable(el.control); }
	if (el.disabled || el.readOnly) { return false; }
	return (name === 'select' || name === 'option' || name === 'button' || name === 'textarea' || name === 'input');
}

export const isEditable = (el) => {
	if (!el) { return false; }
	if (el.readOnly || el.disabled) { return false; }
	if (el.isContentEditable) { return true; }
	const name = el.nodeName.toLowerCase();
	return (el.nodeType === 1 && (name === 'textarea' || (name === 'input'/* && /^(?:text|date|datetime-local|email|month|number|password|search|tel|time|url|week)$/.test(el.type)*/)));
}

export const isXScrollable = (el) => {
	if (!el || el.nodeType !== 1) { return false; }
	if (el.scrollLeftMax != null) { return (el.scrollLeftMax > 0); }
	if (el == document.scrollingElement) { return el.scrollWidth > el.clientWidth; }
	return ((el.scrollWidth > el.clientWidth) && (['scroll', 'auto'].includes(window.getComputedStyle(el).overflowX)));
}

export const isYScrollable = (el) => {
	if (!el || el.nodeType !== 1) { return false; }
	if (el.scrollTopMax != null) { return (el.scrollTopMax > 0); }
	if (el == document.scrollingElement) { return el.scrollHeight > el.clientHeight; }
	return ((el.scrollHeight > el.clientHeight) && (['scroll', 'auto'].includes(window.getComputedStyle(el).overflowY)));
}

export const isScrollable = (el) => (isXScrollable(el) || isYScrollable(el));

let lowerBound, refreshLowerBound;
export const normalizeDelta = (e, using) => {
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
}