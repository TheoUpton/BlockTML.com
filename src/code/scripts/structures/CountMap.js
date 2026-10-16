export class CountMap extends Map{
    static{
        delete this.prototype.set;
        delete this.prototype.delete;
        delete this.prototype.clear;
    }
    countOf(obj){
        const count = this.get(obj)
        return count === undefined ? 0 : count;
    }
    decrement(obj){
        const count = this.get(obj)
        if(count === undefined)
            throw new Error(`Cannot decrease class ${obj}`);
        count == 1 ? Map.prototype.delete.call(this, obj) : Map.prototype.set.call(this, obj, count -1)
        return count - 1;
    }
    increment(obj){
        const count = this.get(obj)
        Map.prototype.set.call(this, obj, count? count + 1 : 1);
        return count? count + 1 : 1;
    }
}