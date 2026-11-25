export class Coord{
    constructor(x, y){this.x = x;this.y = y;}
    *[Symbol.iterator]() {yield this.x;yield this.y;}
    /**
     * @param {DOMRect} rect 
     * @return {boolean}
     */
    isIn(rect){return rect.left <= this.x && this.x <= rect.right && rect.top <= this.y && this.y <= rect.bottom;}
}