//#region registry
    const classRegistry = {};


    export function register(Class){
        classRegistry[Class.name] = Class;
        return Class;
    } 
//#endregion registry

//#region createFromJSON
    export function createFromJSON(JSON) {
        if(!Object.hasOwn(JSON, "class"))
            return JSON;
        const ClassConstructor = classRegistry[JSON.class];
        if (ClassConstructor) {
            if (typeof ClassConstructor.createFromJSON === "function") {
                // Web Component class
                return ClassConstructor.createFromJSON(JSON);
            } else {
                // Regular class
                return new ClassConstructor(JSON);
            }
        } else {
            throw new Error(`Class ${JSON.class} not found`);
        }
    }
//#endregion createFromJSON

//#region populateFromJSON
    export function populateFromJSON(JSON){
        if(!Object.hasOwn(JSON, "object"))
            return JSON;
        const object = window[JSON.object];
        if (object) {
            if (typeof object.populateFromJSON === "function") {
                return object.populateFromJSON(JSON);
            }
            else{
                throw new Error(`Object ${JSON.object} does not have the function populateFromJSON`)
            }
        } else {
            throw new Error(`Object ${JSON.object} not found`);
        }
    }
//#endregion populateFromJSON

//#region isJSONObject
    export function isJSONObject(obj) {
        return Object.prototype.toString.call(obj) === "[object Object]" &&
            Object.getPrototypeOf(obj) === Object.prototype;
    }
//#endregion isJSONObject

//#region isFunction
    export function isFunction(query){return typeof query === "function" && !/^class\s/.test(Function.prototype.toString.call(query));}
//#endregion isFunction




//#region callByPath
    /**
     * 
     * @param {Object} obj 
     * @param {[...string[], (string|{method:string, type:"getter"|"setter"|"call"|"construct"})]} path 
     * @param  {...any} args 
     * @returns 
     */
    export function callByPath(obj, path, ...args) {
        let context = obj;
        const finalMethod = path.slice(-1)[0];
        const methodType =  isString(finalMethod) ? undefined : finalMethod.type;
        //path[path.length-1] = methodType ? finalMethod.method : path[path.length-1];
        
        args = args.map(arg => isFunction(arg)? arg() : arg);
        
        for (let i = 0; i < path.length - 1; i++) 
            context = context[path[i]];
        
        switch(methodType){
            case "getter":
                return context[path[path.length - 1].method];
            case "setter":
                return context[path[path.length - 1].method] = args[0];
            case "call":
                return context[path[path.length - 1].method].call(context, ...args);
            case "construct":
                return Reflect.construct(context[path[path.length - 1].method], ...args);
            default:
                const method = context[path[path.length - 1]];
                try{return isFunction(method) ? method.call(context, ...args) : method;
                }catch(error){return method(...args);}
        }
        
        
    }
//#endregion

//#region  isString
    export function isString(query){return typeof query === 'string' || query instanceof String}
//#endregion isString

export const inputRegexes = new (class{
    get letter(){return [/[^a-z]/gi,/(?<=[a-z]+).*/gi]}
    get letters(){return [/[^a-z]/gi];}
    get lettersHyphenated(){return [/[^a-z\-]/gi];}
    get identifier(){return [/^[^a-z]*(?=[a-zA-Z])|[^a-z0-9_\-]+/gi];}
    get identifiers(){return [/[^a-z ]/gi];}
    get integers(){return [/[^0-9-]+|(?<=\..*)\./g, /(?!^)-/g];}
    get naturals(){return [/[^0-9]/g];}
    get positiveReals(){return  [/[^\d.]+|(?<=\..*)\./g];}
    get reals(){return [/[^0-9.-]+|(?<=\..*)\./g, /(?!^)-/g];}
    get allChars(){return [];}
    get allCharsNoSpace(){return [/[ ]/g];}
})();