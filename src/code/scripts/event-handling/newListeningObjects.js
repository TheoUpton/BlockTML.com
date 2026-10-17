import { isString } from "../utils";
export const newListeningObjects = new (class extends Map{
    /**
     * @param {string | string[]} types 
     * @param {object} object 
     */
    set(types, object){
        if(isString(types))
            types = [types]
        for(const type of types){
            if(!this.has(type))
                super.set(type, new Set());
            this.get(type).add(object);
        }
    }
    /**
     * @param {string | string[]} types 
     * @param {object} object 
     */
    delete(types, object){
        if(isString(types))
            types = [types]
        for(const type of types){
            if(!this.has(type))
                continue;
            this.get(type).delete(object);
            if(this.get(type).size == 0)
                super.delete(type);
        }
    }
})();