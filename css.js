import { Signal, Root, Cleanup } from '/node_modules/reactive/reactive.js';
import { kebab, eachPair } from './util.js';

const extractSelectors = (str) => {

}

const keyVals = (str) => {
	
}

const normalize = (map) => {

	return map;
}

const fixDot = (rule) => {
	if (rule[0] === '.') { return rule; }
	const part = /^[a-z\-]+/.exec(rule)[0];
	if (Elements.has(part)) { return rule; }
	return '.' + rule;
}

const resolve = (buffer, rules, elem, clear) => {
	if (clear) { elem.textContent = ''; rules.clear(); }
	if (buffer.size) {
		for (const [ key, val ] of buffer) {
			if (val.delete != null) { for (let i = 0; i !== val.delete.length; i++) { rules.delete(val.delete[i]); } }
			if (val.set != null) { for (let i = 0; i !== val.set.length; i++) { Array.isArray(val.set) ? rules.set(key, ...val.set[i]) : rules.set(key, val.set[i]); } }
			if (val.add != null) { for (let i = 0; i !== val.add.length; i++) { Array.isArray(val.add[i]) ? rules.add(key, ...val.add[i]) : rules.add(key, val.add[i]); } }
		}
	}
	buffer.clear();
}

const notify = (ruleset, rule) => {
	const obs = ruleset.observers.get(rule);
	for (const fn of obs) { fn(ruleset.get(rule)); }
}

const Tokens = [];
const Elems = [];

const globalBump = new Signal(false);

let globalElem = document.querySelector('style[data-reactive]');
if (globalElem != null) {
	globalElem.textContent = '';
} else {
	globalElem = document.createElement('style');
	globalElem.type = 'text/css'; globalElem.setAttribute('data-reactive', '');
	(document.head || document.getElementsByTagName('head')[0]).appendChild(globalElem);
}

const globalBuffer = new Map();
const globalRules = new RuleSet(globalElem.styleSheet || globalElem.sheet);
let globalAwaitingClear = false;

Root(() => (globalBump() && (resolve(globalBuffer, globalRules, globalElem, globalAwaitingClear), globalAwaitingClear = false)));

export default Style;
function Style (token) {
	if (!new.target) { throw 'Style must be called with new.'; }
	if (token == null) { throw 'Style must be created with a unique string token.'; }
	if (Tokens.includes(token)) { throw (token + ' is already in use.'); }
	Tokens.push(token);
	token = String(token);

	let elem = document.querySelector('style[data-reactive-' + token + ']');
	if (elem != null) {
		elem.textContent = '';
	} else {
		elem = document.createElement('style');
		elem.type = 'text/css'; elem.setAttribute('data-reactive-' + token, '');
		(document.head || document.getElementsByTagName('head')[0]).appendChild(elem);
	}
	Elems.push(elem);

	Object.defineProperties(this, {
		elem: { value: elem },
		bump: { value: new Signal(false) },
		buffer: { value: new Map() },
		rules: { value: new RuleSet(elem.styleSheet || elem.sheet) },
		awaitingClear: { value: false, writable: true }
	});

	let disposer;
	Root((d) => (disposer = d, (this.bump() && (resolve(this.buffer, this.rules, this.elem, this.awaitingClear), this.awaitingClear = false))));
	Cleanup(() => (disposer(), (document.head || document.getElementsByTagName('head')[0]).removeChild(elem)));
}

const stylesheetAdd = (buffer, bump, path) => {
	if (!path.length) { return; }
	if (path.length === 1) { throw 'hmm'; }
	let queue = buffer.get(path[0]);
	if (queue == null) { queue = { add: [Array.prototype.slice.call(path, 1)] }; buffer.set(path[0], queue); }
	else if (queue.add == null) { queue.add = [Array.prototype.slice.call(path, 1)]; }
	else { queue.add.push(Array.prototype.slice.call(path, 1)); }
	bump(true);
}
const stylesheetSet = (buffer, bump, path) => {
	if (!path.length) { return; }
	if (path.length === 1) {
		if (typeof path[0] === 'string') { throw 'set string'; }
		eachPair(path[0], (key, val) => stylesheetSet(buffer, bump, [key, val]));
	}
	let queue = buffer.get(path[0]);
	if (queue == null) { queue = { set: [Array.prototype.slice.call(path, 1)] }; buffer.set(path[0], queue); }
	else if (queue.set == null) { queue.set = [Array.prototype.slice.call(path, 1)]; }
	else { queue.set.push(Array.prototype.slice.call(path, 1)); }
	bump(true);
}
const stylesheetDelete = (buffer, bump, path) => {
	if (!path.length) { return; }
	if (path.length === 1) { throw 'hmm'; }
	let queue = buffer.get(path[0]);
	if (queue == null) { queue = { delete: [Array.prototype.slice.call(path, 1)] }; buffer.set(path[0], queue); }
	else if (queue.delete == null) { queue.delete = [Array.prototype.slice.call(path, 1)]; }
	else { queue.delete.push(Array.prototype.slice.call(path, 1)); }
	bump(true);
}
const stylesheetToString = (style, format) => {
	const rules = style.elem.sheet.cssRules, out = [];
	console.log(rules);
	for (let i = 0; i !== rules.length; i++) { out.push(rules[i].cssText, (format ? '\n' : ' ')); }
	return out.join('');
}

Object.defineProperties(Style, {
	add: { value: function () { stylesheetAdd(globalBuffer, globalBump, arguments); return this; }},
	set: { value: function () { stylesheetSet(globalBuffer, globalBump, arguments); return this; }},
	delete: { value: function () { stylesheetDelete(globalBuffer, globalBump, arguments); }},
	clear: { value: function () { globalAwaitingClear = true; globalBump(true); }},
	has: { value: function () { return globalRules.has(arguments); }},
	get: { value: function () { return globalRules.get(arguments); }},
	entries: { value: function () { return globalRules.entries(); }},
	keys: { value: function () { return globalRules.keys(); }},
	values: { value: function () { return globalRules.values(); }},
	[Symbol.iterator]: { value: function () { return globalRules.entries(); }},
	forEach: { value: function (fn) { globalRules.forEach(fn); }},
	toString: { value: function (format) { return stylesheetToString(this, format); }},
	watch: { value: function (rule, fn) { return globalRules.watch(rule, fn); }},
	unwatch: { value: function (rule, fn) { return globalRules.unwatch(rule, fn); }},
});

Object.defineProperties(Style.prototype, {
	add: { value: function () { stylesheetAdd(this.buffer, this.bump, arguments); return this; }},
	set: { value: function () { stylesheetSet(this.buffer, this.bump, arguments); return this; }},
	delete: { value: function () { stylesheetDelete(this.buffer, this.bump, arguments); }},
	clear: { value: function () { this.awaitingClear = true; this.bump(true); }},
	has: { value: function () { return this.rules.has(arguments); }},
	get: { value: function () { return this.rules.get(arguments); }},
	entries: { value: function () { return this.rules.entries(); }},
	keys: { value: function () { return this.rules.keys(); }},
	values: { value: function () { return this.rules.values(); }},
	[Symbol.iterator]: { value: function () { return this.rules.entries(); }},
	forEach: { value: function (fn) { this.rules.forEach(fn); }},
	toString: { value: function (format) { return stylesheetToString(this, format); }},
	watch: { value: function (rule, fn) { return this.rules.watch(rule, fn); }},
	unwatch: { value: function (rule, fn) { return this.rules.unwatch(rule, fn); }}
});

function RuleSet (domInterface) {
	if (!new.target) { throw 'RuleSet must be called with new.'; }
	Object.defineProperties(this, {
		dom: { value: domInterface },
		model: { value: new Map() },
		bridge: { value: [] },
		observers: { value: new Map() }
	});
}
Object.defineProperties(RuleSet.prototype, {
	set: { value: function () {
		let path = arguments;
		if (!path.length) { return this; }
		if (path.length === 1) {
			let value = path[0];
			value = (typeof value === 'string') ? extractSelectors(value) : normalize(value);
			eachPair(value, (key, val) => { this.set(key, val); });
			return this;
		}
		let rule = kebab(path[0].trim().replace(/\s+/, ' '));
		Array.isArray(path[0]) && (path = path[0]);
		let meta = this.model.get(rule);

		if (rule.startsWith('@media')) {
			if (meta != null) { meta.rules.set(Array.prototype.slice.call(path, 1)); }
			else {
				meta = { index: this.dom.insertRule(rule + '{}') };
				this.model.set(rule, meta);
				meta.rules = new RuleSet(this.dom.cssRules[meta.index]);
				meta.rules.set(Array.prototype.slice.call(path, 1));
			}
			this.observers.has(rule) && notify(this, rule);
			return this;
		}

		if (rule.startsWith('@keyframes')) {

			return this;
		}

		if (rule.startsWith('@font-face')) {

			return this;
		}


		let style = path[1], value = path[2];
		if (value == null) {
			value = style;
			let disp;
			if (meta != null) {
				disp = meta.disposers;
				if (disp != null) { for (const d of disp.values()) { d(); } disp.clear(); }
				this.dom.deleteRule(meta.index);
			} else { meta = { index: this.dom.cssRules.length }; this.model.set(rule, meta); }

			if (typeof value === 'string') {
				value = value.trim();
				const next = [rule, (value[0] === '{' ? '' : '{'), value, (value[value.length - 1] === '}' ? '' : '}')].join('');
				this.dom.insertRule(next, meta.index);
			} else {
				const fnKeys = [], fnVals = [], next = [ fixDot(rule), '{' ];
				eachPair(normalize(value), (key, val) => {
					if (typeof val === 'function') { fnKeys.push(key); fnVals.push(val); }
					else { next.push(kebab(key), ':', val, ';'); }
				});
				next.push('}');
				this.dom.insertRule(next.join(''), meta.index);
				const RuleStyle = this.dom.cssRules[meta.index].style;
				for (let i = 0; i !== fnKeys.length; i++) {
					const key = kebab(fnKeys[i]), val = fnVals[i];
					let disposer; Root((d) => {
						disposer = d; let temp = val;
						while (typeof temp === 'function') { temp = temp(); }
						temp ? RuleStyle.setProperty(key, String(temp)) : RuleStyle.removeProperty(key);
						this.observers.has(rule) && notify(this, rule);
					});
					(disp == null) && (disp = meta.disposers = new Map());
					disp.set(key, disposer);
				}
			}
			if (disp && !disp.size) { delete meta.disposers; }
			this.observers.has(rule) && notify(this, rule);
			return this;
		}

		style = kebab(style);
		let disp;
		if (meta != null) {
			disp = meta.disposers;
			if (disp != null) { const d = disp.get(style); (d != null) && d(); disp.delete(d); }
		} else { meta = { index: dom.insertRule(rule + '{}') }; this.model.set(rule, meta); }
		const RuleStyle = this.dom.cssRules[meta.index].style;
		if (typeof value === 'function') {
			let disposer; Root((d) => {
				disposer = d; let temp = value;
				while (typeof temp === 'function') { temp = temp(); }
				temp ? RuleStyle.setProperty(style, String(temp).trim()) : RuleStyle.removeProperty(style);
				this.observers.has(rule) && notify(this, rule);
			});
			(disp == null) && (disp = meta.disposers = new Map());
			disp.set(style, disposer);
		} else { RuleStyle.setProperty(style, String(value).trim()); }
		if (disp && !disp.size) { delete meta.disposers; }
		this.observers.has(rule) && notify(this, rule);
		return this;
	}},
	add: { value: function () {
		let path = arguments;
		if (!path.length) { return this; }
		if (path.length === 1) {
			let value = path[0];
			value = (typeof value === 'string') ? extractSelectors(value) : normalize(value);
			eachPair(value, (key, val) => { this.add(key, val); });
			return this;
		}
		let rule = path[0].trim().replace(/\s+/, ' ');
		Array.isArray(path[0]) && (path = path[0])
		let meta = this.model.get(rule);

		if (rule.startsWith('@media')) {
			if (meta != null) { meta.rules.add(Array.prototype.slice.call(path, 1)); }
			else {
				meta = { index: this.dom.insertRule(rule + '{}') };
				this.model.set(rule, meta);
				meta.rules = new RuleSet(this.dom.cssRules[meta.index]);
				meta.rules.set(Array.prototype.slice.call(path, 1));
			}
			this.observers.has(rule) && notify(this, rule);
			return this;
		}

		let value = path[2];
		if (value != null) { return this.set(rule, style, value); }
		value = path[1];

		if (meta == null) { meta = { index: this.dom.insertRule(rule + '{}') }; this.meta.set(rule, meta); }

		if (typeof value === 'string') { value = keyVals(value); }
		else { value = normalize(value); }
		const RuleStyle = this.dom.cssRules[meta.index].style;
		const disp = meta.disposers;
		if (disp != null) {
			eachPair(value, (key, val) => {
				key = kebab(key);
				const d = disp.get(key); (d != null) && d();
				if (typeof val === 'function') {
					let disposer; Root((d) => {
						disposer = d; let temp = val;
						while (typeof temp === 'function') { temp = temp(); }
						temp ? RuleStyle.setProperty(key, String(temp)) : RuleStyle.removeProperty(key);
					});
					disp.set(key, disposer);
				} else { (d != null) && disp.delete(key); RuleStyle.setProperty(key, String(val)); }
			});
		} else {
			eachPair(value, (key, val) => {
				key = kebab(key);
				if (typeof val === 'function') {
					let disposer; Root((d) => {
						disposer = d; let temp = val;
						while (typeof temp === 'function') { temp = temp(); }
						temp ? RuleStyle.setProperty(key, String(temp)) : RuleStyle.removeProperty(key);
					});
					(disp == null) && (disp = meta.disposers = new Map());
					disp.set(key, disposer);
				} else { RuleStyle.setProperty(key, String(val)); }
			});
		}
		if (disp && !disp.size) { delete meta.disposers; }
		this.observers.has(rule) && notify(this, rule);
		return this;
	}},
	delete: { value: function () {
		let path = arguments;
		if (!path.length) { return false; }
		if (Array.isArray(path[0])) { for (let i = path[0].length; i--;) { this.delete(path[0][i]); } }
		const rule = path[0].trim().replace(/\s+/, ' ');
		const meta = this.model.get(rule);
		if (meta == null) { return false; }
		if (meta.rules) {
			if (path.length > 1) { return meta.rules.delete(...Array.prototype.slice.call(path, 1)); }
			this.bridge.splice(meta.index, 1);
			for (let i = meta.index; i !== this.bridge.length; i++) { bridge[i].index--; }
			this.dom.deleteRule(meta.index);
			this.model.delete(rule);
			this.observers.has(rule) && notify(this, rule);
			return true;
		}

		const style = path[1];
		if (style == null) {
			const disp = meta.disposers;
			if (disp != null) { for (const d of disp.values()) { d(); } }
			this.bridge.splice(meta.index, 1);
			for (let i = meta.index; i !== this.bridge.length; i++) { bridge[i].index--; }
			this.dom.deleteRule(meta.index);
			this.model.delete(rule);
			this.observers.has(rule) && notify(this, rule);
			return true;
		}

		const RuleStyle = this.dom.cssRules[meta.index].style;
		const disp = meta.disposers;
		if (disp != null) { const d = disp.get(style); (d != null) && d(); if (!disp.size) { delete meta.disposers; } }
		RuleStyle.removeProperty(style);
		if (!RuleStyle.length) {
			this.bridge.splice(meta.index, 1);
			for (let i = meta.index; i !== this.bridge.length; i++) { bridge[i].index--; }
			this.dom.deleteRule(meta.index);
			this.model.delete(rule);
		}
		this.observers.has(rule) && notify(this, rule);
		return true;
	}},
	has: { value: function () {
		let path = arguments;
		if (!path.length) { return; }
		if (Array.isArray(path[0])) { path = path[0]; }
		const rule = path[0].trim().replace(/\s+/, ' ');
		const meta = this.model.get(rule);
		if (meta == null) { return false; }
		if (meta.rules) { return (path.length === 1) ? true : meta.rules.has(Array.prototype.slice.call(path, 1)); }

		const style = path[1];
		if (style == null) { return true; }

		return !(this.dom.cssRules[meta.index].style.getPropertyValue(style) === '');
	}},
	get: { value: function () {
		let path = arguments;
		if (!path.length) { return; }
		if (Array.isArray(path[0])) { path = path[0]; }
		const rule = path[0].trim().replace(/\s+/, ' ');
		const meta = this.model.get(rule);
		if (meta == null) { return; }
		if (meta.rules) { return (path.length === 1) ? meta.rules : meta.rules.get(Array.prototype.slice.call(path, 1)); }

		const style = path[1];
		if (style == null) { return new StyleMap(this, rule, meta.index); }

		const val = this.dom.cssRules[meta.index].style.getPropertyValue(style);
		return (val === '') ? null : val;
	}},
	size: { get: function () { return this.bridge.length; }},
	clear: { value: function () {
		this.model.clear(); for (let i = this.bridge.length; i--;) { this.bridge.pop(); }
		if (this.dom.cssRules.length) { for (let i = this.dom.cssRules.length; i--;) { this.dom.deleteRule(i); }}
		for (const rule of this.observers.keys()) { notify(this, rule); }
	}},
	entries: { value: function () {
		let i = 0; return ({ next: () => {
			const done = i === this.dom.cssRules.length;
			if (done) { return ({ done, value: undefined }); }
			let rule = this.dom.cssRules[i];
			if (rule.type === 1) { return ({ done, value: [ rule.selectorText, new StyleMap(this, rule, i++) ] }); }
			else if (rule.type === 4) {
				const meta = this.model.get(i++);
				const key = '@media ' + rule.conditionText;
				const vals = new Map();
				for (const [ k, v ] of meta.rules.entries()) { vals.set(k, v); }
				return ({ done, value: [ key, vals ] });
			}
		}});
	}},
	keys: { value: function () {
		const entries = this.entries();
		return ({ next: () => { const next = entries.next(); return (next.done ? ({ done: true, value: undefined }) : ({ done: false, value: next.value[0] })); }});
	}},
	values: { value: function () {
		const entries = this.entries();
		return ({ next: () => { const next = entries.next(); return (next.done ? ({ done: true, value: undefined }) : ({ done: false, value: next.value[1] })); }});
	}},
	forEach: { value: function (fn) { for (const [k,v] of this.entries()) { fn(k,v); }}},
	watch: { value: function (rule, fn) {
		rule = rule.trim().replace(/\s+/, ' ');
		let obs = this.observers.get(rule);
		if (obs == null) { obs = new Set(); this.observers.set(rule, obs); }
		obs.add(fn);
		return this;
	}},
	unwatch: { value: function (rule, fn) {
		rule = path[0].trim().replace(/\s+/, ' ');
		const obs = this.observers.get(rule); fn = path[1];
		if (obs == null) { return false; }
		return obs.delete(fn);
	}}
});
Object.defineProperty(RuleSet.prototype, Symbol.iterator, { value: RuleSet.prototype.entries });

function StyleMap (ruleset, rule, index) {
	Object.defineProperties(this, {
		parent: { value: ruleset },
		rule: { value: rule },
		meta: { value: ruleset.model.get(rule) },
		style: { value: ruleset.dom.cssRules[index].style },
	});
}
Object.defineProperties(StyleMap.prototype, {
	set: { value: function (key, val) {
		const disp = this.meta.disposers;
		if (disp != null) { const d = disp.get(key); (d != null) && d(); (!disp.size) && (delete this.meta.disposers); }

		if (typeof val === 'function') {
			let disposer; Root((d) => {
				disposer = d; let temp = val;
				while (typeof temp === 'function') { temp = temp(); }
				temp ? this.style.setProperty(style, String(temp)) : this.style.removeProperty(style);
			});
			(disp == null) && (disp = this.meta.disposers = new Map());
			disp.set(key, disposer);
		} else if (val != null) { this.style.setProperty(key, String(val)); }
		else { this.style.removeProperty(key); }

		this.parent.observers.has(this.rule) && notify(this.parent, this.rule);
		return this;
	}},
	delete: { value: function (key) {
		if (!Array.prototype.includes.call(this.style, key)) { return false; }
		const disp = this.meta.disposers;
		if (disp != null) { const d = disp.get(key); (d != null) && d(); (!disp.size) && (delete this.meta.disposers); }
		this.style.removeProperty(key);
		this.parent.observers.has(this.rule) && notify(this.parent, this.rule);
		return true;
	}},
	has: { value: function (key) { }},
	size: { get: function() { return this.style.length; }},
	clear: { value: function () {
		for (let i = this.style.length; i--;) { this.style.removeProperty(this.style[i]); }
		this.parent.observers.has(this.rule) && notify(this.parent, this.rule);
	}},
	keys: { value: function () {
		let i = 0; return ({ next: () => {
			const done = i === this.style.length;
			if (done) { return ({ done: true, value: undefined }); }
			return ({ done: false, value: this.style[i] });
		}});
	}},
	values: { value: function () {
		let i = 0; return ({ next: () => {
			const done = i === this.style.length;
			if (done) { return ({ done: true, value: undefined }); }
			return ({ done: false, value: this.style[i].getPropertyValue(this.style[i]) });
		}});
	}},
	entries: { value: function () {
		let i = 0; return ({ next: () => {
			const done = i === this.style.length;
			if (done) { return ({ done: true, value: undefined }); }
			return ({ done: false, value: [ this.style[i], this.style.getPropertyValue(this.style[i]) ] });
		}});
	}},
	forEach: { value: function (fn) { for (const [k,v] of this.entries()) { fn(k,v); } }}
});
Object.defineProperty(StyleMap.prototype, Symbol.iterator, { value: StyleMap.prototype.entries });