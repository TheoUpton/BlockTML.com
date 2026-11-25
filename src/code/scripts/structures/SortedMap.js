import { SortedArray } from "./SortedArray";
export class SortedMap extends Map{
    #keys = new SortedArray();
    constructor(entries){
        super(entries);
        if(entries)
            entries.forEach(entry => {
                if(!this.has(entry))
                    this.#keys.push(entry)
            })
    }
    keys(){return this.#keys[Symbol.iterator]();}
    *[Symbol.iterator](){yield* this.entries();}
    clear(){
        this.#keys.length = 0;
        return super.clear();
    }
    delete(key){
        this.#keys.delete(key);
        return super.delete(key);
    }
    *entries(){
        for (const key of this.#keys)
            yield [key, this.get(key)];
    }
    forEach(callback, thisArg){
        for(const key of this.#keys){
            const value = this.get(key);
            callback.call(thisArg, value, key, this);
        }
    }
    groupBy(callback){
        const result = new Map();
        for (const key of this.#keys) {
            const value = this.get(key);
            const groupKey = callback(value, key, this);
            if (!result.has(groupKey)) 
                result.set(groupKey, []);
            result.get(groupKey).push([key, value]);
        }
        return result;
    }
    set(key, value){
        if(!this.has(key))
            this.#keys.push(key);
        return super.set(key, value);
    }
    *values(){
        for (const key of this.#keys)
            yield this.get(key);
    }
}