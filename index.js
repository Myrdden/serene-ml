export { default as h } from './hyperscript.js';
export { default as Style } from './css.js';

// Really wish there was an easier way to do this.
import {
	repeat,
	kebab,
	eachPair,
	hash,
	isElementName,
	decodeText,
	isClickable,
	isEditable,
	isXScrollable,
	isYScrollable,
	isScrollable,
	normalizeDelta
} from './util.js';
import {
	hasEvent,
	hasCapturedEvent,
	hasAnyEvent
} from './hyperscript.js';
export const Util = {
	hasEvent,
	hasCapturedEvent,
	hasAnyEvent,
	repeat,
	kebab,
	eachPair,
	hash,
	isElementName,
	decodeText,
	isClickable,
	isEditable,
	isXScrollable,
	isYScrollable,
	isScrollable,
	normalizeDelta
}