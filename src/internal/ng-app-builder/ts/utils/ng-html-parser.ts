/* tslint:disable max-classes-per-file max-line-length no-console jsdoc-format */
import {Token, BaseParser, BaseLexer} from 'dr-comp-package/wfh/dist/base-LLn-parser';

export enum HtmlTokenType {
	// comments,
	['<'],
	['>'],
	['('],
	[')'],
	['['],
	[']'],
	['</'],
	['='],
	identity,
	stringLiteral,
	any, // .*
	space
}

export {HtmlTokenType as TokenType};
export class TemplateLexer extends BaseLexer<HtmlTokenType> {
	*[Symbol.iterator](): Iterator<Token<HtmlTokenType>> {
		while (true) {
			let char: string = this.la();
			const start = this.position;
			if (char == null) {
				return;
			}
			switch (char) {
				case '>':
				case '(':
				case ')':
				case '[':
				case ']':
				case '=':
					this.advance();
					yield new Token(HtmlTokenType[char], this, start);
					continue;
				default:
			}
			if (char === '<' && this.isIdStart(2)) {
				yield this.openTagStart();
			} else if (this.isNext('</')) {
				yield this.closeTagStart();
			} else if (this.isIdStart()) {
				do {
					this.advance();
					char = this.la();
				} while (this.isIdStart());
				yield new Token(HtmlTokenType.identity, this, start);
			} else if (char === '"') {
				yield this.stringLit('"');
			} else if (char === '\'') {
				yield this.stringLit('\'');
			} else if (char === '`') {
				yield this.stringLit('`');
			} else if (this.isWhitespace()) {
				do {
					this.advance();
				} while (this.isWhitespace());
				// yield new Token(HtmlTokenType.space, ' ');
				continue;
			} else {
				yield new Token(HtmlTokenType.any, this, start);
				this.advance();
			}
		}
	}
	openTagStart() {
		const start = this.position;
		this.advance();
		do {
			this.advance();
		} while (this.isIdStart());
		return new Token(HtmlTokenType['<'], this, start);
	}
	closeTagStart() {
		this.advance(2);
		const start = this.position;
		while (this.la() !== '>') {
			this.advance();
		}
		return new Token(HtmlTokenType['</'], this, start);
	}
	isIdStart(laIdx = 1) {
		const char = this.la(laIdx);
		return /[^<>()\[\]"'=`/]/.test(char) && /\S/.test(char);
	}
	isWhitespace() {
		const chr = this.la();
		return /\s/.test(chr);
	}

	stringLit(quote: string) {
		this.advance();
		const start = this.position;
		while (this.la() !== quote) {
			if (this.la() == null)
				this.throwError();
			// console.log(':', this.la());
			if (this.la() === '\\') {
				this.advance();
			}
			this.advance();
		}
		const tk = new Token(HtmlTokenType.stringLiteral, this, start);
		this.advance();
		return tk;
	}

	skip() {
		let chr = this.la();
		while(chr != null) {
			if (this.isComment()) {
				this.comment();
			} else if (this.isSwigComment()) {
				this.swigComment();
			} else {
				break;
			}
			chr = this.la();
 		}
	}

	isComment() {
		return this.isNext('<!--');
	}
	comment() {
		this.advance(4);
		while(!this.isNext('-->')) {
			if (this.la() == null)
				throw new Error('Comment is not closed, ' + this.getCurrentPosInfo());
			this.advance();
		}
		this.advance(3);
		return true;
	}
	isSwigComment() {
		return this.isNext('{#');
	}
	swigComment() {
		this.advance(2);
		while (!this.isNext('#}')) {
			this.advance();
		}
	}
}

export interface TagAst {
	name?: string;
	attrs?: {[key: string]: AttributeValueAst};
	start: number;
	end: number;
	[key: string]: any;
}
export interface AttributeValueAst {
	text: string; start: number; end: number;
}
export class TemplateParser extends BaseParser<HtmlTokenType, TemplateLexer> {
	lexer: TemplateLexer;
	constructor(input: string) {
		const lexer = new TemplateLexer(input);
		super(lexer);
		this.lexer = lexer;
	}

	getCurrentPosInfo(): string {
		const start = this.la() ? this.la().start : null;
		if (start) {
			const lineCol = this.lexer.getLineColumn(start);
			return `Line ${lineCol[0] + 1} column ${lineCol[1] + 1}`;
		}
	}
	skip() {
		while (this.la() != null && this.la().type === HtmlTokenType.space) {
			this.advance();
		}
	}
	parse(): TagAst[] {
		const ast: TagAst[] = [];
		while(this.la() != null) {
			if (this.la().type === HtmlTokenType['<']) {
				ast.push(this.tag());
			} else if (this.la().type === HtmlTokenType['</']) {
				this.advance();
			} else {
				this.advance();
			}
		}
		return ast;
	}
	tag(): TagAst {
		const first = this.advance();
		const name = first.text.substring(1);
		const attrs = this.attributes();
		const last = this.advance(); // >
		return {name, attrs, start: first.start, end: last.end};
	}
	attributes() {
		const attrs: {[key: string]: AttributeValueAst} = {};
		while (this.la() != null && this.la().type !== HtmlTokenType['>']) {
			if (this.isNgAttrName()) {
				const key = this.ngAttrName();
				attrs[key] = this.attrValue();
			} else if (this.la().type === HtmlTokenType.identity) {
				const key = this.attrName();
				attrs[key] = this.attrValue();
			} else {
				console.log('Previous tokens: ', this.lb().text);
				this.throwError(this.la().text);
			}
		}
		return attrs;
	}
	isNgAttrName() {
		const type = this.la().type;
		return type === HtmlTokenType['['] || type === HtmlTokenType['('];
	}
	ngAttrName() {
		const kind = this.la().type === HtmlTokenType['['] ? HtmlTokenType[']'] : HtmlTokenType[')'];
		let name: string;
		this.advance();
		if (this.isNgAttrName())
			name = this.ngAttrName();
		else
			name = this.attrName();
		if (this.la().type !== kind)
			this.throwError(this.la().text);
		this.advance();
		return name;
	}
	attrName() {
		return this.advance().text;
	}
	attrValue(): AttributeValueAst {
		if (this.la() && this.la().type === HtmlTokenType['=']) {
			// let {text, start, end} = this.advance(2);
			// return {text, start, end};
			return this.advance(2);
		} else {
			return null;
		}
	}
}
