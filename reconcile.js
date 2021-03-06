import { Effect } from 'serene-js';

const reconcile = (node, anchor, current, next) => {
	let type;
	while ((type = typeof next) === 'function') { next = next(); }
	if (next === current) { return current; }

	if (next == null || type === 'boolean') {
		if (anchor == null) {
			node.textContent = '';
		} else if (Array.isArray(current)) {
			for (let i = current.length; i--;) { node.removeChild(current[i]); }
		} else { current != null && node.removeChild(current); }
		return null;
	}

	if (type === 'string' || type === 'number' || next instanceof Date) {
		type !== 'string' && (next = next.toString());
		if (anchor == null) {
			current != null && current.nodeType === 3
				? (node.firstChild.data = next)
				: (node.textContent = next);
			return node.firstChild;
		} else if (Array.isArray(current)) {
			current[0].nodeType === 3
				? (current[0].data = next, next = current[0])
				: (next = document.createTextNode(next), node.replaceChild(next, current[0]));
			for (let i = current.length; --i;) { node.removeChild(current[i]); }
		} else {
			current != null
				? current.nodeType === 3
					? (current.data = next, next = current)
					: (next = document.createTextNode(next), node.replaceChild(next, current))
				: (next = document.createTextNode(next), node.insertBefore(next, anchor));
		}
		return next;
	}

	if (next instanceof Node) {
		if (anchor == null) {
			node.textContent = '';
			node.appendChild(next);
		} else if (Array.isArray(current)) {
			node.replaceChild(next, current[0]);
			for (let i = current.length; --i;) { node.removeChild(current[i]); }
		} else {
			current == null
				? node.insertBefore(next, anchor)
				: node.replaceChild(next, current);
		}
		return next;
	}

	if (Array.isArray(next) || (Symbol.iterator in next)) {
		const empty = Array.isArray(next) ? (next.length === 0) : next[Symbol.iterator]().next().done;
		if (empty) {
			if (anchor == null) { node.textContent = ''; }
			else if (Array.isArray(current) && current.length) { for (let i = current.length; i--;) { node.removeChild(current[i]); } }
			else { current != null && node.removeChild(current); }
			return null;
		}
		const future = [];
		next = normalize(next, [], future);
		if (Array.isArray(current)) { diff(node, current, next); }
		else {
			current != null && node.removeChild(current);
			for (let i = 0, len = next.length; i !== len; i++) { node.insertBefore(next[i], anchor); }
		}
		if (!future.length) { return next; }
		for (let inp = future.length + 1, anc = future.length; inp -= 2, (anc -= 2) <= 0;) {
			const input = future[inp], anchor = future[anc];
			Effect((current) => reconcile(node, anchor, current, input()), null);
		}
		return next;
	}

	if (next.valueOf !== Object.prototype.valueOf) { return reconcile(node, anchor, current, next.valueOf()); }
	if (next.toString !== Object.prototype.toString) { return reconcile(node, anchor, current, next.toString()); }
	console.warn('While reconciling to DOM, an object with no primitive representation (as per valueOf()) was encountered. It has been ignored.');
	console.log(next);
}
export default reconcile;

const normalize = (input, out, future) => {
	out === undefined && (out = []);
	if (input == null || input === true || input === false) { return out; }
	const type = typeof input;
	if (type === 'function') {
		const anchor = document.createTextNode('');
		out.push(anchor); future.push(anchor, input);
	} else if (input instanceof Node) { out.push(input); }
	else if (type === 'string' || type === 'number' || input instanceof Date) {
		out.push(document.createTextNode(type === 'string' ? input : input.toString()));
	else if (Array.isArray(input)) { for (let i = 0, len = input.length; i !== len; i++) { normalize(input[i], out, future); } }
	else if (Symbol.iterator in input) { for (let x of input) { normalize(x, out, future); } }
	else if (input.valueOf !== Object.prototype.valueOf) { normalize(input.valueOf(), out, future); }
	else if (input.toString !== Object.prototype.toString) { normalize(input.toString(), out, future); }
	return out;
}

const diff = (node, a, b) => {
	let aL = 0, bL = 0;
	let aR = a.length, bR = b.length;
	let map;

	const after = a[aR-1].nextSibling;

	while (aL < aR || bL < bR) {
		if (aL === aR) { // Append
			const anchor = bR < b.length
				? bL
					? b[bL-1].nextSibling
					: b[bR-bL]
				: after;
			while (bL !== bR) { node.insertBefore(b[bL++], anchor); }
		} else if (bL === bR) { // Remove
			while (aL !== aR) {
				if (!map || !map.has(a[aL])) { node.removeChild(a[aL]); }
				aL++;
			}
		} else if (a[aL] === b[bL]) { // Common Prefix
			aL++; bL++;
		} else if (a[aR-1] === b[bR-1]) { // Common Suffix
			aR--; bR--;
		} else if (a[aL] === b[bR-1] && b[bL] === a[aR-1]) { // Swap Backwards
			const anchor = a[--aR].nextSibling;
			node.insertBefore(b[bL++], a[aL++].nextSibling);
			node.insertBefore(b[--bR], anchor);
			a[aR] = b[bR];
		} else {
			if (!map) {
				map = new Map();
				let i = bL;
				while (i !== bR) { map.set(b[i], i++); }
			}

			const index = map.get(a[aL]);
			if (index != null) {
				if (bL < index && index < bR) {
					let i = aL, seq = 1, temp;
					while (++i < aR && i < bR) {
						if ((temp = map.get(a[i])) == null || temp !== index + seq) { break; }
						seq++;
					}

					if (seq > index - bL) {
						const anchor = a[aL];
						while (bL < index) { node.insertBefore(b[bL++], anchor); }
					} else { node.replaceChild(b[bL++], a[aL++]); }
				} else { aL++; }
			} else { node.removeChild(a[aL++]); }
		}
	}
}