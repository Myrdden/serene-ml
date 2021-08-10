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