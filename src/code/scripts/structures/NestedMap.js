import { SortedMap } from "./SortedMap";
import { isJSONObject, createFromJSON } from "../utils";
export class NestedMap extends SortedMap{
    constructor(JSON = []){
        super();
        this._size = 0;
        if(JSON == [])
            return;
        for(const entry of JSON){
            const key1 = entry[0], key2 = entry[1], data = isJSONObject(entry[2])? createFromJSON(entry[2]): entry[2];
            this.set(key1, key2, data)
        }
    }
    static key = "NestedMap";
    toJSON(){
        return {
            class: NestedMap.key,
            data: [...this.entries()]
        };
    }
    has(primaryKey, secondaryKey = undefined){
        return super.has(primaryKey) && (secondaryKey === undefined || super.get(primaryKey).has(secondaryKey)); //(!super.has(primaryKey))? false : super.get(primaryKey).has(secondaryKey);
    }
    get(primaryKey, SecondaryKey){
        const superGet = super.get(primaryKey);
        return superGet ? superGet.get(SecondaryKey) : undefined;
    }
    set(primaryKey, secondaryKey, data){
        if(!super.has(primaryKey))
            super.set(primaryKey, new SortedMap());
        super.get(primaryKey).set(secondaryKey, data);
        this._size ++;
    }
    *values(...primaryKeys){
        if(primaryKeys.length === 0)
            primaryKeys = this.keys();
        //else if(!Array.isArray(primaryKeys))
        //    primaryKeys = [primaryKeys];


        for(const key of primaryKeys){
            const innerMap = super.get(key);
            if(innerMap)
                yield* innerMap.values();
        }
    }


    get size(){return this._size;}
    size(...primaryKeys){
        if(primaryKeys.length === 0)
            return this._size;
        //if(!Array.isArray(primaryKeys))
        //    primaryKeys = [primaryKeys];
        let total = 0;
        for(const key of primaryKeys){
            const innerMap = super.get(key);
            total += (innerMap)? innerMap.size : 0;
        }
        return total;
    }


    delete(primaryKey, secondaryKey = undefined){
        const innerMap = super.get(primaryKey);
        if(!innerMap)
            return false;
        let deleted = true;
        if(secondaryKey === undefined)
            this._size -= innerMap.size;
        else if (deleted = innerMap.delete(secondaryKey)) //assignment, not comparison
            this._size--;
        
        if(innerMap.size === 0 || secondaryKey === undefined)
            super.delete(primaryKey);
        return deleted;
    }


    clear(...primaryKeys){
        if(primaryKeys.length === 0){
            this._size = 0;
            return super.clear();
        }
        //if(!Array.isArray(primaryKeys))
        //    primaryKeys = [primaryKeys];
        for(const key of primaryKeys){
            const innerMap = super.get(key);
            if(super.delete(key))
                this._size -= innerMap.size;
        }
    }
}