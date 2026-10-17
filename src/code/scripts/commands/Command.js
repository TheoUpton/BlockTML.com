import { register, isFunction, callByPath } from "../utils";
export class Command {
    /**
     * @param {object} options 
     * @param {Object|Function} [options.object]
     * @param {[...string[], (string|{method:string, type:"getter"|"setter"|"call"|"construct"})]} [options.methods]
     * @param {any[]} [options.args]
     * @param {ObjectDirectory} [options.focus]
     */
    constructor({object = undefined, methods = [], args = [], focus = undefined}={object: undefined, methods: [], args: [], focus: undefined}){
        this.object = object;
        this.methods = methods;
        //this.parameter = parameter;
        this.args = args;
    }


    isReady(){return (this.object != undefined) && (this.methods.length > 0)}
    isEmpty(){return (this.object == undefined) && (this.methods.length == 0) && (this.args.length == 0)}
    clear(){
        this.object = undefined;
        this.methods = [];
        //this.parameter = undefined;
        this.args = [];
    }
    toJSON(){
        return {
            object: this.object,
            methods: this.methods,
            args: this.args
        };
    }
    execute(){
        try{
            let object = isFunction(this.object) ? this.object() : this.object;
            callByPath(object, this.methods, ...this.args);
            return true;
        }catch(error){
            console.error(error);
            return false;
        }
    }
    /** @returns {Command} */
    copy(){return new Command(this.toJSON());}
} register(Command);