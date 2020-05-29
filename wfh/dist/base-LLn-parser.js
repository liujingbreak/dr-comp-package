"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @Deprecated use LLn-parser instead
 */
const sortedIndex_1 = __importDefault(require("lodash/sortedIndex"));
class Token {
    constructor(type, lexer, start) {
        this.type = type;
        this.start = start;
        this.text = lexer.getText(start);
        this.end = lexer.position;
        this.lineColumn = lexer.getLineColumn(start);
    }
}
exports.Token = Token;
class LookAhead {
    constructor(source) {
        this.currPos = -1;
        this.isString = typeof source === 'string';
        this.cached = [];
        this.sourceIterator = source[Symbol.iterator]();
    }
    get position() {
        return this.currPos + 1;
    }
    /**
       * look ahead for 1 character
       * @param num default is 1
       * @return null if EOF is reached
       */
    la(num = 1) {
        const readPos = this.currPos + num;
        return this.read(readPos);
    }
    lb(num = 1) {
        const pos = this.currPos - (num - 1);
        if (pos < 0)
            return null;
        return this.read(pos);
    }
    advance(count = 1) {
        let current = null;
        for (let i = 0; i < count; i++) {
            current = this.la(1);
            if (current == null)
                this.throwError();
            this.currPos++;
        }
        return current;
    }
    /**
       * Same as `return la(1) === values[0] && la(2) === values[1]...`
       * @param values lookahead string or tokens
       */
    isNext(...values) {
        return this._isNext(values);
    }
    _isNext(values, isEqual = (a, b) => a === b) {
        let compareTo;
        let compareFn;
        if (this.isString) {
            compareTo = values.join('');
            compareFn = (a, b) => a === b;
        }
        else {
            compareTo = values;
            compareFn = isEqual;
        }
        let i = 0;
        const l = compareTo.length;
        let next = this.la(i + 1);
        while (true) {
            if (i === l)
                return true;
            next = this.la(i + 1);
            if (next == null)
                return false; // EOF
            else if (!compareFn(next, compareTo[i]))
                return false;
            i++;
        }
    }
    throwError(unexpected = 'End-of-file') {
        throw new Error(`Unexpected ${JSON.stringify(unexpected)} at ` + this.getCurrentPosInfo());
    }
    /**
       * Do not read postion less than 0
       * @param pos
       */
    read(pos) {
        const cached = this.cached;
        while (cached.length <= pos) {
            const next = this.sourceIterator.next();
            if (next.done)
                return null;
            cached.push(next.value);
        }
        return cached[pos];
    }
}
exports.LookAhead = LookAhead;
/**
 * 1. Define a "TokenType" enum
 * 2. Implement your own "Lexer" which extends "BaseLexer" with type paremeter of your enum "TokenType"
 * 3. Implement `[Symbol.interator]()` function in your Lexer:
```ts
    *[Symbol.iterator](): Iterator<Token<TokenType>> {
        while (this.la() != null) {
            const start = this.position;
            if (this.la() === '\n') {
                this.advance();
                yield new Token(TokenType.EOL, this, start);
            }
            ...
        }
    }
```
 */
class BaseLexer extends LookAhead {
    constructor(source) {
        super(source);
        this.source = source;
        this.lineBeginPositions = [-1];
        const originNext = this.sourceIterator.next;
        const it = this.sourceIterator;
        // - Monkey patch iterator's next() method to track beginning position of each line
        let nextCount = 0;
        const self = this;
        this.sourceIterator.next = function () {
            const nextRes = originNext.call(it);
            const chr = nextRes.value;
            if (!nextRes.done && chr === '\n')
                self.lineBeginPositions.push(nextCount);
            nextCount++;
            return nextRes;
        };
    }
    getText(startPos) {
        return this.source.slice(startPos, this.position);
    }
    getCurrentPosInfo() {
        const [line, col] = this.getLineColumn(this.currPos);
        // tslint:disable-next-line:max-line-length
        return `get ${JSON.stringify(this.la())}, at line ${line + 1}, column ${col + 1}, after ${JSON.stringify(this.lb())}`;
    }
    /**
       * @return zero-based [line, column] value
       * */
    getLineColumn(pos) {
        const lineIndex = sortedIndex_1.default(this.lineBeginPositions, pos) - 1;
        const linePos = this.lineBeginPositions[lineIndex];
        return [lineIndex, pos - (linePos + 1)];
    }
}
exports.BaseLexer = BaseLexer;
class TokenFilter extends LookAhead {
    constructor(lexer, skipType) {
        super(lexer);
        this.skipType = skipType;
    }
    *[Symbol.iterator]() {
        while (this.la() != null) {
            if (this.la().type === this.skipType) {
                this.advance();
            }
            else {
                yield this.la();
                this.advance();
            }
        }
    }
    getCurrentPosInfo() {
        const start = this.la();
        if (start == null)
            return 'EOF';
        return `line ${start.lineColumn[0] + 1} column ${start.lineColumn[1] + 1}`;
    }
}
exports.TokenFilter = TokenFilter;
/**
 * TT - token type
 */
class BaseParser extends LookAhead {
    constructor(lexer) {
        super(lexer);
        this.lexer = lexer;
    }
    getCurrentPosInfo() {
        const start = this.la();
        if (start == null)
            return 'EOF';
        return `line ${start.lineColumn[0] + 1} column ${start.lineColumn[1] + 1}`;
    }
    isNextTypes(...types) {
        const comparator = (a, b) => {
            if (a == null)
                return false;
            return a.type === b;
        };
        return this._isNext(types, comparator);
    }
    isNextTokenText(...text) {
        const comparator = (a, b) => {
            if (a == null)
                return false;
            return a.text === b;
        };
        return this._isNext(text, comparator);
    }
}
exports.BaseParser = BaseParser;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiYmFzZS1MTG4tcGFyc2VyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vdHMvYmFzZS1MTG4tcGFyc2VyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7O0FBQUE7O0dBRUc7QUFDSCxxRUFBNkM7QUFFN0MsTUFBYSxLQUFLO0lBS2hCLFlBQW1CLElBQU8sRUFBRSxLQUFtQixFQUN0QyxLQUFhO1FBREgsU0FBSSxHQUFKLElBQUksQ0FBRztRQUNqQixVQUFLLEdBQUwsS0FBSyxDQUFRO1FBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLE9BQU8sQ0FBQyxLQUFLLENBQUMsQ0FBQztRQUNqQyxJQUFJLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxRQUFRLENBQUM7UUFDMUIsSUFBSSxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsYUFBYSxDQUFDLEtBQUssQ0FBQyxDQUFDO0lBQy9DLENBQUM7Q0FDRjtBQVhELHNCQVdDO0FBRUQsTUFBc0IsU0FBUztJQVE3QixZQUFZLE1BQW1CO1FBRnJCLFlBQU8sR0FBRyxDQUFDLENBQUMsQ0FBQztRQUdyQixJQUFJLENBQUMsUUFBUSxHQUFHLE9BQU8sTUFBTSxLQUFLLFFBQVEsQ0FBQztRQUMzQyxJQUFJLENBQUMsTUFBTSxHQUFHLEVBQUUsQ0FBQztRQUNqQixJQUFJLENBQUMsY0FBYyxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDLEVBQUUsQ0FBQztJQUNsRCxDQUFDO0lBRUQsSUFBSSxRQUFRO1FBQ1YsT0FBTyxJQUFJLENBQUMsT0FBTyxHQUFHLENBQUMsQ0FBQztJQUMxQixDQUFDO0lBRUQ7Ozs7U0FJRTtJQUNGLEVBQUUsQ0FBQyxHQUFHLEdBQUcsQ0FBQztRQUNSLE1BQU0sT0FBTyxHQUFHLElBQUksQ0FBQyxPQUFPLEdBQUcsR0FBRyxDQUFDO1FBQ25DLE9BQU8sSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsQ0FBQztJQUM1QixDQUFDO0lBRUQsRUFBRSxDQUFDLEdBQUcsR0FBRyxDQUFDO1FBQ1IsTUFBTSxHQUFHLEdBQUcsSUFBSSxDQUFDLE9BQU8sR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsQ0FBQztRQUNyQyxJQUFJLEdBQUcsR0FBRyxDQUFDO1lBQ1QsT0FBTyxJQUFJLENBQUM7UUFDZCxPQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUM7SUFDeEIsQ0FBQztJQUVELE9BQU8sQ0FBQyxLQUFLLEdBQUcsQ0FBQztRQUNmLElBQUksT0FBTyxHQUFHLElBQUksQ0FBQztRQUNuQixLQUFLLElBQUksQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsRUFBRSxFQUFFO1lBQzlCLE9BQU8sR0FBRyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUMsQ0FBQyxDQUFDO1lBQ3JCLElBQUksT0FBTyxJQUFJLElBQUk7Z0JBQ2pCLElBQUksQ0FBQyxVQUFVLEVBQUUsQ0FBQztZQUNwQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7U0FDaEI7UUFDRCxPQUFPLE9BQU8sQ0FBQztJQUNqQixDQUFDO0lBRUQ7OztTQUdFO0lBQ0YsTUFBTSxDQUFDLEdBQUcsTUFBVztRQUNuQixPQUFPLElBQUksQ0FBQyxPQUFPLENBQUksTUFBTSxDQUFDLENBQUM7SUFDakMsQ0FBQztJQUVELE9BQU8sQ0FBSSxNQUFXLEVBQUUsVUFBVSxDQUFDLENBQUksRUFBRSxDQUFJLEVBQUUsRUFBRSxDQUFDLENBQVEsS0FBSyxDQUFDO1FBQzlELElBQUksU0FBc0IsQ0FBQztRQUMzQixJQUFJLFNBQXFDLENBQUM7UUFDMUMsSUFBSSxJQUFJLENBQUMsUUFBUSxFQUFFO1lBQ2pCLFNBQVMsR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDO1lBQzVCLFNBQVMsR0FBRyxDQUFDLENBQVMsRUFBRSxDQUFTLEVBQUUsRUFBRSxDQUFDLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDL0M7YUFBTTtZQUNMLFNBQVMsR0FBRyxNQUFNLENBQUM7WUFDbkIsU0FBUyxHQUFHLE9BQU8sQ0FBQztTQUNyQjtRQUNELElBQUksQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNWLE1BQU0sQ0FBQyxHQUFHLFNBQVMsQ0FBQyxNQUFNLENBQUM7UUFDM0IsSUFBSSxJQUFJLEdBQUcsSUFBSSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7UUFDMUIsT0FBTyxJQUFJLEVBQUU7WUFDWCxJQUFJLENBQUMsS0FBSyxDQUFDO2dCQUNULE9BQU8sSUFBSSxDQUFDO1lBQ2QsSUFBSSxHQUFHLElBQUksQ0FBQyxFQUFFLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1lBQ3RCLElBQUksSUFBSSxJQUFJLElBQUk7Z0JBQ2QsT0FBTyxLQUFLLENBQUMsQ0FBQyxNQUFNO2lCQUNqQixJQUFJLENBQUMsU0FBUyxDQUFDLElBQUksRUFBRSxTQUFTLENBQUMsQ0FBQyxDQUFDLENBQUM7Z0JBQ3JDLE9BQU8sS0FBSyxDQUFDO1lBQ2YsQ0FBQyxFQUFFLENBQUM7U0FDTDtJQUNILENBQUM7SUFFRCxVQUFVLENBQUMsVUFBVSxHQUFHLGFBQWE7UUFDbkMsTUFBTSxJQUFJLEtBQUssQ0FBQyxjQUFjLElBQUksQ0FBQyxTQUFTLENBQUMsVUFBVSxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO0lBQzdGLENBQUM7SUFJRDs7O1NBR0U7SUFDUSxJQUFJLENBQUMsR0FBVztRQUN4QixNQUFNLE1BQU0sR0FBRyxJQUFJLENBQUMsTUFBTSxDQUFDO1FBQzNCLE9BQU8sTUFBTSxDQUFDLE1BQU0sSUFBSSxHQUFHLEVBQUU7WUFDM0IsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDLGNBQWMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUN4QyxJQUFJLElBQUksQ0FBQyxJQUFJO2dCQUNYLE9BQU8sSUFBSSxDQUFDO1lBQ2QsTUFBTSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDekI7UUFDRCxPQUFPLE1BQU0sQ0FBQyxHQUFHLENBQUMsQ0FBQztJQUNyQixDQUFDO0NBQ0Y7QUFuR0QsOEJBbUdDO0FBRUQ7Ozs7Ozs7Ozs7Ozs7Ozs7R0FnQkc7QUFDSCxNQUFzQixTQUFhLFNBQVEsU0FBaUI7SUFHMUQsWUFBc0IsTUFBYztRQUNsQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7UUFETSxXQUFNLEdBQU4sTUFBTSxDQUFRO1FBRnBDLHVCQUFrQixHQUFhLENBQUMsQ0FBQyxDQUFDLENBQUMsQ0FBQztRQUlsQyxNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDLElBQUksQ0FBQztRQUM1QyxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsY0FBYyxDQUFDO1FBQy9CLG1GQUFtRjtRQUNuRixJQUFJLFNBQVMsR0FBRyxDQUFDLENBQUM7UUFDbEIsTUFBTSxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2xCLElBQUksQ0FBQyxjQUFjLENBQUMsSUFBSSxHQUFHO1lBQ3pCLE1BQU0sT0FBTyxHQUFHLFVBQVUsQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLENBQUM7WUFDcEMsTUFBTSxHQUFHLEdBQUcsT0FBTyxDQUFDLEtBQUssQ0FBQztZQUMxQixJQUFJLENBQUMsT0FBTyxDQUFDLElBQUksSUFBSSxHQUFHLEtBQUssSUFBSTtnQkFDL0IsSUFBSSxDQUFDLGtCQUFrQixDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsQ0FBQztZQUMxQyxTQUFTLEVBQUUsQ0FBQztZQUNaLE9BQU8sT0FBTyxDQUFDO1FBQ2pCLENBQUMsQ0FBQztJQUNKLENBQUM7SUFJRCxPQUFPLENBQUMsUUFBZ0I7UUFDdEIsT0FBTyxJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BELENBQUM7SUFFRCxpQkFBaUI7UUFDZixNQUFNLENBQUMsSUFBSSxFQUFFLEdBQUcsQ0FBQyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxDQUFDO1FBQ3JELDJDQUEyQztRQUMzQyxPQUFPLE9BQU8sSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsYUFBYSxJQUFJLEdBQUcsQ0FBQyxZQUFZLEdBQUcsR0FBRyxDQUFDLFdBQVcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUMsRUFBRSxDQUFDO0lBQ3hILENBQUM7SUFFRDs7V0FFSTtJQUNKLGFBQWEsQ0FBQyxHQUFXO1FBQ3ZCLE1BQU0sU0FBUyxHQUFHLHFCQUFXLENBQUMsSUFBSSxDQUFDLGtCQUFrQixFQUFFLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQztRQUNoRSxNQUFNLE9BQU8sR0FBRyxJQUFJLENBQUMsa0JBQWtCLENBQUMsU0FBUyxDQUFDLENBQUM7UUFDbkQsT0FBTyxDQUFDLFNBQVMsRUFBRSxHQUFHLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUMxQyxDQUFDO0NBQ0Y7QUF4Q0QsOEJBd0NDO0FBRUQsTUFBYSxXQUFlLFNBQVEsU0FBbUI7SUFDckQsWUFBWSxLQUF5QixFQUFTLFFBQVc7UUFDdkQsS0FBSyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBRCtCLGFBQVEsR0FBUixRQUFRLENBQUc7SUFFekQsQ0FBQztJQUVELENBQUMsQ0FBQyxNQUFNLENBQUMsUUFBUSxDQUFDO1FBQ2hCLE9BQU8sSUFBSSxDQUFDLEVBQUUsRUFBRSxJQUFJLElBQUksRUFBRTtZQUN4QixJQUFJLElBQUksQ0FBQyxFQUFFLEVBQUcsQ0FBQyxJQUFJLEtBQUssSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDckMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2FBQ2hCO2lCQUFNO2dCQUNMLE1BQU0sSUFBSSxDQUFDLEVBQUUsRUFBRyxDQUFDO2dCQUNqQixJQUFJLENBQUMsT0FBTyxFQUFFLENBQUM7YUFDaEI7U0FDRjtJQUNILENBQUM7SUFFRCxpQkFBaUI7UUFDZixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDeEIsSUFBSSxLQUFLLElBQUksSUFBSTtZQUNmLE9BQU8sS0FBSyxDQUFDO1FBQ2YsT0FBTyxRQUFRLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFDN0UsQ0FBQztDQUNGO0FBdEJELGtDQXNCQztBQUNEOztHQUVHO0FBQ0gsTUFBc0IsVUFBYyxTQUFRLFNBQW1CO0lBQzdELFlBQXNCLEtBQXlCO1FBQzdDLEtBQUssQ0FBQyxLQUFLLENBQUMsQ0FBQztRQURPLFVBQUssR0FBTCxLQUFLLENBQW9CO0lBRS9DLENBQUM7SUFFRCxpQkFBaUI7UUFDZixNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsRUFBRSxFQUFFLENBQUM7UUFDeEIsSUFBSSxLQUFLLElBQUksSUFBSTtZQUNmLE9BQU8sS0FBSyxDQUFDO1FBQ2YsT0FBTyxRQUFRLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxXQUFXLEtBQUssQ0FBQyxVQUFVLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUM7SUFDN0UsQ0FBQztJQUVELFdBQVcsQ0FBQyxHQUFHLEtBQVU7UUFDdkIsTUFBTSxVQUFVLEdBQUcsQ0FBQyxDQUFXLEVBQUUsQ0FBSSxFQUFFLEVBQUU7WUFDdkMsSUFBSSxDQUFDLElBQUksSUFBSTtnQkFDWCxPQUFPLEtBQUssQ0FBQztZQUNmLE9BQU8sQ0FBQyxDQUFDLElBQUksS0FBSyxDQUFDLENBQUM7UUFDdEIsQ0FBQyxDQUFDO1FBQ0YsT0FBTyxJQUFJLENBQUMsT0FBTyxDQUFJLEtBQUssRUFBRSxVQUFVLENBQUMsQ0FBQztJQUM1QyxDQUFDO0lBRUQsZUFBZSxDQUFDLEdBQUcsSUFBYztRQUMvQixNQUFNLFVBQVUsR0FBRyxDQUFDLENBQVcsRUFBRSxDQUFTLEVBQUUsRUFBRTtZQUM1QyxJQUFJLENBQUMsSUFBSSxJQUFJO2dCQUNYLE9BQU8sS0FBSyxDQUFDO1lBQ2YsT0FBTyxDQUFDLENBQUMsSUFBSSxLQUFLLENBQUMsQ0FBQztRQUN0QixDQUFDLENBQUM7UUFDRixPQUFPLElBQUksQ0FBQyxPQUFPLENBQVMsSUFBSSxFQUFFLFVBQVUsQ0FBQyxDQUFDO0lBQ2hELENBQUM7Q0FDRjtBQTdCRCxnQ0E2QkMiLCJzb3VyY2VzQ29udGVudCI6WyIvKipcbiAqIEBEZXByZWNhdGVkIHVzZSBMTG4tcGFyc2VyIGluc3RlYWRcbiAqL1xuaW1wb3J0IHNvcnRlZEluZGV4IGZyb20gJ2xvZGFzaC9zb3J0ZWRJbmRleCc7XG5cbmV4cG9ydCBjbGFzcyBUb2tlbjxUPiB7XG4gIHRleHQ6IHN0cmluZztcbiAgZW5kOiBudW1iZXI7XG4gIGxpbmVDb2x1bW46IFtudW1iZXIsIG51bWJlcl07XG5cbiAgY29uc3RydWN0b3IocHVibGljIHR5cGU6IFQsIGxleGVyOiBCYXNlTGV4ZXI8VD4sXG4gICAgcHVibGljIHN0YXJ0OiBudW1iZXIpIHtcbiAgICB0aGlzLnRleHQgPSBsZXhlci5nZXRUZXh0KHN0YXJ0KTtcbiAgICB0aGlzLmVuZCA9IGxleGVyLnBvc2l0aW9uO1xuICAgIHRoaXMubGluZUNvbHVtbiA9IGxleGVyLmdldExpbmVDb2x1bW4oc3RhcnQpO1xuICB9XG59XG5cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBMb29rQWhlYWQ8VD4ge1xuICBjYWNoZWQ6IFRbXTtcbiAgLy8gY2hhbm5lbHM6IHtbY2hhbm5lbDogc3RyaW5nXTogVFtdfSA9IHt9O1xuICAvLyBjaGFubmVsUG9zOiB7W2NoYW5uZWw6IHN0cmluZ106IG51bWJlcn0gPSB7fTtcbiAgc291cmNlSXRlcmF0b3I6IEl0ZXJhdG9yPFQ+O1xuICBpc1N0cmluZzogYm9vbGVhbjtcbiAgcHJvdGVjdGVkIGN1cnJQb3MgPSAtMTtcblxuICBjb25zdHJ1Y3Rvcihzb3VyY2U6IEl0ZXJhYmxlPFQ+KSB7XG4gICAgdGhpcy5pc1N0cmluZyA9IHR5cGVvZiBzb3VyY2UgPT09ICdzdHJpbmcnO1xuICAgIHRoaXMuY2FjaGVkID0gW107XG4gICAgdGhpcy5zb3VyY2VJdGVyYXRvciA9IHNvdXJjZVtTeW1ib2wuaXRlcmF0b3JdKCk7XG4gIH1cblxuICBnZXQgcG9zaXRpb24oKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy5jdXJyUG9zICsgMTtcbiAgfVxuXG4gIC8qKlxuXHQgKiBsb29rIGFoZWFkIGZvciAxIGNoYXJhY3RlclxuXHQgKiBAcGFyYW0gbnVtIGRlZmF1bHQgaXMgMVxuXHQgKiBAcmV0dXJuIG51bGwgaWYgRU9GIGlzIHJlYWNoZWRcblx0ICovXG4gIGxhKG51bSA9IDEpOiBUIHwgbnVsbCB7XG4gICAgY29uc3QgcmVhZFBvcyA9IHRoaXMuY3VyclBvcyArIG51bTtcbiAgICByZXR1cm4gdGhpcy5yZWFkKHJlYWRQb3MpO1xuICB9XG5cbiAgbGIobnVtID0gMSk6IFQgfCBudWxsIHtcbiAgICBjb25zdCBwb3MgPSB0aGlzLmN1cnJQb3MgLSAobnVtIC0gMSk7XG4gICAgaWYgKHBvcyA8IDApXG4gICAgICByZXR1cm4gbnVsbDtcbiAgICByZXR1cm4gdGhpcy5yZWFkKHBvcyk7XG4gIH1cblxuICBhZHZhbmNlKGNvdW50ID0gMSk6IFQgfCBudWxsIHtcbiAgICBsZXQgY3VycmVudCA9IG51bGw7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBjb3VudDsgaSsrKSB7XG4gICAgICBjdXJyZW50ID0gdGhpcy5sYSgxKTtcbiAgICAgIGlmIChjdXJyZW50ID09IG51bGwpXG4gICAgICAgIHRoaXMudGhyb3dFcnJvcigpO1xuICAgICAgdGhpcy5jdXJyUG9zKys7XG4gICAgfVxuICAgIHJldHVybiBjdXJyZW50O1xuICB9XG5cbiAgLyoqXG5cdCAqIFNhbWUgYXMgYHJldHVybiBsYSgxKSA9PT0gdmFsdWVzWzBdICYmIGxhKDIpID09PSB2YWx1ZXNbMV0uLi5gXG5cdCAqIEBwYXJhbSB2YWx1ZXMgbG9va2FoZWFkIHN0cmluZyBvciB0b2tlbnNcblx0ICovXG4gIGlzTmV4dCguLi52YWx1ZXM6IFRbXSk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLl9pc05leHQ8VD4odmFsdWVzKTtcbiAgfVxuXG4gIF9pc05leHQ8Qz4odmFsdWVzOiBDW10sIGlzRXF1YWwgPSAoYTogVCwgYjogQykgPT4gYSBhcyBhbnkgPT09IGIpOiBib29sZWFuIHtcbiAgICBsZXQgY29tcGFyZVRvOiBDW118IHN0cmluZztcbiAgICBsZXQgY29tcGFyZUZuOiAoLi4uYXJnOiBhbnlbXSkgPT4gYm9vbGVhbjtcbiAgICBpZiAodGhpcy5pc1N0cmluZykge1xuICAgICAgY29tcGFyZVRvID0gdmFsdWVzLmpvaW4oJycpO1xuICAgICAgY29tcGFyZUZuID0gKGE6IHN0cmluZywgYjogc3RyaW5nKSA9PiBhID09PSBiO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb21wYXJlVG8gPSB2YWx1ZXM7XG4gICAgICBjb21wYXJlRm4gPSBpc0VxdWFsO1xuICAgIH1cbiAgICBsZXQgaSA9IDA7XG4gICAgY29uc3QgbCA9IGNvbXBhcmVUby5sZW5ndGg7XG4gICAgbGV0IG5leHQgPSB0aGlzLmxhKGkgKyAxKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKGkgPT09IGwpXG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgbmV4dCA9IHRoaXMubGEoaSArIDEpO1xuICAgICAgaWYgKG5leHQgPT0gbnVsbClcbiAgICAgICAgcmV0dXJuIGZhbHNlOyAvLyBFT0ZcbiAgICAgIGVsc2UgaWYgKCFjb21wYXJlRm4obmV4dCwgY29tcGFyZVRvW2ldKSlcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgaSsrO1xuICAgIH1cbiAgfVxuXG4gIHRocm93RXJyb3IodW5leHBlY3RlZCA9ICdFbmQtb2YtZmlsZScpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYFVuZXhwZWN0ZWQgJHtKU09OLnN0cmluZ2lmeSh1bmV4cGVjdGVkKX0gYXQgYCArIHRoaXMuZ2V0Q3VycmVudFBvc0luZm8oKSk7XG4gIH1cblxuICBhYnN0cmFjdCBnZXRDdXJyZW50UG9zSW5mbygpOiBzdHJpbmc7XG5cbiAgLyoqXG5cdCAqIERvIG5vdCByZWFkIHBvc3Rpb24gbGVzcyB0aGFuIDBcblx0ICogQHBhcmFtIHBvcyBcblx0ICovXG4gIHByb3RlY3RlZCByZWFkKHBvczogbnVtYmVyKTogVCB8IG51bGwge1xuICAgIGNvbnN0IGNhY2hlZCA9IHRoaXMuY2FjaGVkO1xuICAgIHdoaWxlIChjYWNoZWQubGVuZ3RoIDw9IHBvcykge1xuICAgICAgY29uc3QgbmV4dCA9IHRoaXMuc291cmNlSXRlcmF0b3IubmV4dCgpO1xuICAgICAgaWYgKG5leHQuZG9uZSlcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICBjYWNoZWQucHVzaChuZXh0LnZhbHVlKTtcbiAgICB9XG4gICAgcmV0dXJuIGNhY2hlZFtwb3NdO1xuICB9XG59XG5cbi8qKlxuICogMS4gRGVmaW5lIGEgXCJUb2tlblR5cGVcIiBlbnVtXG4gKiAyLiBJbXBsZW1lbnQgeW91ciBvd24gXCJMZXhlclwiIHdoaWNoIGV4dGVuZHMgXCJCYXNlTGV4ZXJcIiB3aXRoIHR5cGUgcGFyZW1ldGVyIG9mIHlvdXIgZW51bSBcIlRva2VuVHlwZVwiXG4gKiAzLiBJbXBsZW1lbnQgYFtTeW1ib2wuaW50ZXJhdG9yXSgpYCBmdW5jdGlvbiBpbiB5b3VyIExleGVyOlxuYGBgdHNcblx0KltTeW1ib2wuaXRlcmF0b3JdKCk6IEl0ZXJhdG9yPFRva2VuPFRva2VuVHlwZT4+IHtcblx0XHR3aGlsZSAodGhpcy5sYSgpICE9IG51bGwpIHtcblx0XHRcdGNvbnN0IHN0YXJ0ID0gdGhpcy5wb3NpdGlvbjtcblx0XHRcdGlmICh0aGlzLmxhKCkgPT09ICdcXG4nKSB7XG5cdFx0XHRcdHRoaXMuYWR2YW5jZSgpO1xuXHRcdFx0XHR5aWVsZCBuZXcgVG9rZW4oVG9rZW5UeXBlLkVPTCwgdGhpcywgc3RhcnQpO1xuXHRcdFx0fVxuXHRcdFx0Li4uXG5cdFx0fVxuXHR9XG5gYGBcbiAqL1xuZXhwb3J0IGFic3RyYWN0IGNsYXNzIEJhc2VMZXhlcjxUPiBleHRlbmRzIExvb2tBaGVhZDxzdHJpbmc+IGltcGxlbWVudHMgSXRlcmFibGU8VG9rZW48VD4+IHtcbiAgbGluZUJlZ2luUG9zaXRpb25zOiBudW1iZXJbXSA9IFstMV07XG5cbiAgY29uc3RydWN0b3IocHJvdGVjdGVkIHNvdXJjZTogc3RyaW5nKSB7XG4gICAgc3VwZXIoc291cmNlKTtcbiAgICBjb25zdCBvcmlnaW5OZXh0ID0gdGhpcy5zb3VyY2VJdGVyYXRvci5uZXh0O1xuICAgIGNvbnN0IGl0ID0gdGhpcy5zb3VyY2VJdGVyYXRvcjtcbiAgICAvLyAtIE1vbmtleSBwYXRjaCBpdGVyYXRvcidzIG5leHQoKSBtZXRob2QgdG8gdHJhY2sgYmVnaW5uaW5nIHBvc2l0aW9uIG9mIGVhY2ggbGluZVxuICAgIGxldCBuZXh0Q291bnQgPSAwO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIHRoaXMuc291cmNlSXRlcmF0b3IubmV4dCA9IGZ1bmN0aW9uKCkge1xuICAgICAgY29uc3QgbmV4dFJlcyA9IG9yaWdpbk5leHQuY2FsbChpdCk7XG4gICAgICBjb25zdCBjaHIgPSBuZXh0UmVzLnZhbHVlO1xuICAgICAgaWYgKCFuZXh0UmVzLmRvbmUgJiYgY2hyID09PSAnXFxuJylcbiAgICAgICAgc2VsZi5saW5lQmVnaW5Qb3NpdGlvbnMucHVzaChuZXh0Q291bnQpO1xuICAgICAgbmV4dENvdW50Kys7XG4gICAgICByZXR1cm4gbmV4dFJlcztcbiAgICB9O1xuICB9XG5cbiAgYWJzdHJhY3QgW1N5bWJvbC5pdGVyYXRvcl0oKTogSXRlcmF0b3I8VG9rZW48VD4+O1xuXG4gIGdldFRleHQoc3RhcnRQb3M6IG51bWJlcikge1xuICAgIHJldHVybiB0aGlzLnNvdXJjZS5zbGljZShzdGFydFBvcywgdGhpcy5wb3NpdGlvbik7XG4gIH1cblxuICBnZXRDdXJyZW50UG9zSW5mbygpOiBzdHJpbmcge1xuICAgIGNvbnN0IFtsaW5lLCBjb2xdID0gdGhpcy5nZXRMaW5lQ29sdW1uKHRoaXMuY3VyclBvcyk7XG4gICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm1heC1saW5lLWxlbmd0aFxuICAgIHJldHVybiBgZ2V0ICR7SlNPTi5zdHJpbmdpZnkodGhpcy5sYSgpKX0sIGF0IGxpbmUgJHtsaW5lICsgMX0sIGNvbHVtbiAke2NvbCArIDF9LCBhZnRlciAke0pTT04uc3RyaW5naWZ5KHRoaXMubGIoKSl9YDtcbiAgfVxuXG4gIC8qKlxuXHQgKiBAcmV0dXJuIHplcm8tYmFzZWQgW2xpbmUsIGNvbHVtbl0gdmFsdWVcblx0ICogKi9cbiAgZ2V0TGluZUNvbHVtbihwb3M6IG51bWJlcik6IFtudW1iZXIsIG51bWJlcl0ge1xuICAgIGNvbnN0IGxpbmVJbmRleCA9IHNvcnRlZEluZGV4KHRoaXMubGluZUJlZ2luUG9zaXRpb25zLCBwb3MpIC0gMTtcbiAgICBjb25zdCBsaW5lUG9zID0gdGhpcy5saW5lQmVnaW5Qb3NpdGlvbnNbbGluZUluZGV4XTtcbiAgICByZXR1cm4gW2xpbmVJbmRleCwgcG9zIC0gKGxpbmVQb3MgKyAxKV07XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFRva2VuRmlsdGVyPFQ+IGV4dGVuZHMgTG9va0FoZWFkPFRva2VuPFQ+PiBpbXBsZW1lbnRzIEl0ZXJhYmxlPFRva2VuPFQ+PiB7XG4gIGNvbnN0cnVjdG9yKGxleGVyOiBJdGVyYWJsZTxUb2tlbjxUPj4sIHB1YmxpYyBza2lwVHlwZTogVCkge1xuICAgIHN1cGVyKGxleGVyKTtcbiAgfVxuXG4gICpbU3ltYm9sLml0ZXJhdG9yXSgpOiBJdGVyYXRvcjxUb2tlbjxUPj4ge1xuICAgIHdoaWxlICh0aGlzLmxhKCkgIT0gbnVsbCkge1xuICAgICAgaWYgKHRoaXMubGEoKSEudHlwZSA9PT0gdGhpcy5za2lwVHlwZSkge1xuICAgICAgICB0aGlzLmFkdmFuY2UoKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHlpZWxkIHRoaXMubGEoKSE7XG4gICAgICAgIHRoaXMuYWR2YW5jZSgpO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGdldEN1cnJlbnRQb3NJbmZvKCk6IHN0cmluZyB7XG4gICAgY29uc3Qgc3RhcnQgPSB0aGlzLmxhKCk7XG4gICAgaWYgKHN0YXJ0ID09IG51bGwpXG4gICAgICByZXR1cm4gJ0VPRic7XG4gICAgcmV0dXJuIGBsaW5lICR7c3RhcnQubGluZUNvbHVtblswXSArIDF9IGNvbHVtbiAke3N0YXJ0LmxpbmVDb2x1bW5bMV0gKyAxfWA7XG4gIH1cbn1cbi8qKlxuICogVFQgLSB0b2tlbiB0eXBlXG4gKi9cbmV4cG9ydCBhYnN0cmFjdCBjbGFzcyBCYXNlUGFyc2VyPFQ+IGV4dGVuZHMgTG9va0FoZWFkPFRva2VuPFQ+PiB7XG4gIGNvbnN0cnVjdG9yKHByb3RlY3RlZCBsZXhlcjogSXRlcmFibGU8VG9rZW48VD4+KSB7XG4gICAgc3VwZXIobGV4ZXIpO1xuICB9XG5cbiAgZ2V0Q3VycmVudFBvc0luZm8oKTogc3RyaW5nIHtcbiAgICBjb25zdCBzdGFydCA9IHRoaXMubGEoKTtcbiAgICBpZiAoc3RhcnQgPT0gbnVsbClcbiAgICAgIHJldHVybiAnRU9GJztcbiAgICByZXR1cm4gYGxpbmUgJHtzdGFydC5saW5lQ29sdW1uWzBdICsgMX0gY29sdW1uICR7c3RhcnQubGluZUNvbHVtblsxXSArIDF9YDtcbiAgfVxuXG4gIGlzTmV4dFR5cGVzKC4uLnR5cGVzOiBUW10pOiBib29sZWFuIHtcbiAgICBjb25zdCBjb21wYXJhdG9yID0gKGE6IFRva2VuPFQ+LCBiOiBUKSA9PiB7XG4gICAgICBpZiAoYSA9PSBudWxsKVxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICByZXR1cm4gYS50eXBlID09PSBiO1xuICAgIH07XG4gICAgcmV0dXJuIHRoaXMuX2lzTmV4dDxUPih0eXBlcywgY29tcGFyYXRvcik7XG4gIH1cblxuICBpc05leHRUb2tlblRleHQoLi4udGV4dDogc3RyaW5nW10pOiBib29sZWFuIHtcbiAgICBjb25zdCBjb21wYXJhdG9yID0gKGE6IFRva2VuPFQ+LCBiOiBzdHJpbmcpID0+IHtcbiAgICAgIGlmIChhID09IG51bGwpXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIHJldHVybiBhLnRleHQgPT09IGI7XG4gICAgfTtcbiAgICByZXR1cm4gdGhpcy5faXNOZXh0PHN0cmluZz4odGV4dCwgY29tcGFyYXRvcik7XG4gIH1cbn1cbiJdfQ==