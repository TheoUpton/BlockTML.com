import { isString } from "../utils";

export class SemiString extends Array{
    constructor(...args){
        super();
        this.push(...args);
    }
    oldpush(arg){
        if(typeof arg === "string"){
            if(this.length == 0)
                return super.push(arg);
            if(!typeof this[this.length-1] === "string")
                return super.push(arg);
            this[this.length-1] += arg;
            return this.length;
        }
        if(!arg instanceof SemiString) super.push(arg);
        if(arg.length == 0) return this.length;
        if(this.length == 0)
            return super.push(...arg);
        if((!typeof this[this.length-1] === "string") || (!typeof arg[0] === "string"))
            return super.push(...arg);
        const end = this.pop();
        arg[0] = end + arg[0];
        return super.push(...arg);
    }
    push(...args){
        for(const arg of args){
            if(this.length > 0 && isString(this[this.length-1]) && isString(arg))
                this[this.length-1] += arg;
            else    
                super.push(arg);
        }
    }
    clear(){this.length = 0;}
}