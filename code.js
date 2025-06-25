//#region ******Global******




//#region Objects





    //#region |  class registry
        const classRegistry = {};

        function register(Class){
            classRegistry[Class.name] = Class;
            return Class;
        } 
    //#endregion class registry

    //#region |  input rules
        const inputRegexes = new (class{
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
    //#endregion input rules
//#endregion objects

//#region Functions





    //#region |  createFromJSON
        function createFromJSON(JSON) {
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


    //#region |  populateFromJSON
        function populateFromJSON(JSON){
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


    //#region |  isJSONObject
        function isJSONObject(obj) {
            return Object.prototype.toString.call(obj) === "[object Object]" &&
                Object.getPrototypeOf(obj) === Object.prototype;
        }
    //#endregion isJSONObject


    //#region |  isFunction
        function isFunction(query){return typeof query === "function" && !/^class\s/.test(Function.prototype.toString.call(query));}
    //#endregion isFunction



    //#region |  callByPath
        /**
         * 
         * @param {Object} obj 
         * @param {[...string[], (string|{method:string, type:"getter"|"setter"|"call"|"construct"})]} path 
         * @param  {...any} args 
         * @returns 
         */
        function callByPath(obj, path, ...args) {
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


    //#region |  isString
        function isString(query){return typeof query === 'string' || query instanceof String}
    //#endregion isString
//#endregion functions




//#region Classes





    //#region |  Data Structures





        //#region |  |  Sorted Array
            class SortedArray extends Array {
                constructor(compareFn = (a, b) => String(a).localeCompare(String(b, undefined, { sensitivity: 'base' }))) {
                    super();
                    this.compare = compareFn;
                }

                push(...items) {
                    for (const item of items) {
                        let low = 0;
                        let high = this.length;
                        // Binary search for correct insert position
                        while (low < high) {
                            let mid = (low + high) >> 1;
                            if (this.compare(item, this[mid]) > 0) 
                                low = mid + 1;
                            else 
                                high = mid;
                        }
                        super.splice(low, 0, item); // insert at the sorted position
                    }
                    return this.length;
                }
                indexOf(item){
                    let low = 0;
                    let high = this.length;
                    // Binary search for correct insert position
                    while (low < high) {
                        let mid = (low + high) >> 1;
                        if (this.compare(item, this[mid]) > 0) 
                            low = mid + 1;
                        else 
                            high = mid;
                    }
                    return this[low] === item ? low : -1;
                }
                delete(item){
                    const index = this.indexOf(item);
                    if(index > -1)
                        this.splice(index, 1);
                }
            }
        //#endregion sorted array


        //#region |  |  SortedMap
            class SortedMap extends Map{
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
        //#endregion sorted map
    

        //#region |  |  Nested Map
            class NestedMap extends SortedMap{
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
                toJSON(){
                    return {
                        class: NestedMap.name,
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
        //#endregion Nested Map


        //#region |  |  Count Map
            class CountMap extends Map{
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
        //#endregion ____Count Map
    
//#endregion data structures
//#region |  Generic Classes





        //#region |  |  Semi String
            class SemiString extends Array{
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
        //#endregion Semi String
        
        
        //#region |  |  Coord
            class Coord{
                constructor(x, y){this.x = x;this.y = y;}
                *[Symbol.iterator]() {yield this.x;yield this.y;}
                /**
                 * @param {DOMRect} rect 
                 * @return {boolean}
                 */
                isIn(rect){return rect.left <= this.x && this.x <= rect.right && rect.top <= this.y && this.y <= rect.bottom;}
            }
        //#endregion Coord
//#endregion Generic Classes


    //#region |  |  Command
        class Command {
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
    //#endregion Command
//#endregion Classes











//#region CommandStack
const commandStack = new (class {
    #undoStack = [];
    #redoStack = [];
    constructor(){}
    get _undoStack(){return this.#undoStack;}
    get _redoStack(){return this.#redoStack;}
    undo(){
        if(this._undoStack.length == 0)
            return;
        const command = this._undoStack.pop();
        command.undo.execute();
        this._redoStack.push(command);
    }
    redo(){
        if(this._redoStack.length == 0)
            return;
        const command = this._redoStack.pop();
        command.redo.execute();
        this._undoStack.push(command);
    }
    /**
     * 
     * @param {Object} options
     * @param {Command} options.undo
     * @param {Command} options.redo 
     */
    /*pushCopy({undo, redo}){
        //if(this.#undoStack.length < savepoint.undostacklength)
        //    savepoint.undostacklength = null;
        this.#undoStack.push({undo: undo.copy(), redo: redo.copy()});
        this.#redoStack.length = 0;
    }*/
    push({undo, redo}){
        this._undoStack.push({undo: undo, redo: redo});
        this._redoStack.length = 0;
    }
    #inProgress = new (class{
        #undo = new Command();
        #redo = new Command();
        get undo(){return this.#undo;}
        get redo(){return this.#redo;}

        clear(){
            //this.undo.clear();
            this.#undo = new Command();
            //this.redo.clear();
            this.#redo = new Command();
        }
        push(){
            if(this.undo.isEmpty() && this.redo.isEmpty())
                return;
            commandStack.push({undo: this.undo, redo: this.redo});
            this.clear();
            //console.info("command pushed!");
        }
        print(){console.error("command in progress", this.undo, this.redo);}
    });
    get inProgress(){return this.#inProgress};
})();
//#endregion CommandStack


//#region ObjectPath
class ObjectPath extends Array{
    #pathLocked = false; #type = ObjectPath.types.relative;
    constructor(object = undefined){
        //debugger;
        super();
        if(!object) return;
        if(isString(object)){
            this.createFromString(object)
            this.#pathLocked = true;
        }
        else{
            while(object != Folder.ROOT){
                this.unshift(object.pathFromParent());
                object = object.parent;
            }
            this.#pathLocked = true;
            this.#type = ObjectPath.types.absolute;
        }
        
    }
    get type(){return this.#type;}
    get pathLocked(){return this.#pathLocked;}
    get oldtarget(){
        let currentEntry = Folder.ROOT;
        for(const identifier of this)
            currentEntry = currentEntry[identifier.getter][identifier.method](...identifier.params);
        return currentEntry;
    }
    get target(){
        if(this.type === ObjectPath.types.relative)
            throw new Error("target method requires a start, use relativeTarget method");
        return this.relativeTarget(Folder.ROOT);
        /*let currentEntry = Folder.ROOT;
        for(const identifier of this)
            currentEntry = callByPath(currentEntry, identifier.methods, ...identifier.params);
        return currentEntry*/
    }
    createFromString(string){
        if(this.pathLocked)
            throw new Error(`${ObjectPath.name} is locked`);
        if(!isString(string))
            throw new Error(`must be a string as argument`)
        //check correct form of file extension exists in posix
        const split = string.split("/");
        const fileString = split.slice(-1)[0];
        if(fileString == "")
            throw new Error(`Path cannot end with "/"`);
        const fileStringSplit = fileString.split(".");
        if(fileStringSplit.length <2)
            throw new Error(`File name must contain a full stop "."`);

        if(split.length > 1){
            let canNavUp = true;
            if(split[0] == ""){
                this.#type = ObjectPath.types.absolute;
                canNavUp = false;
            }else if(split[0] == ".."){
                this.push({methods:["parent"], params:[]}, {methods:["parent"], params:[]});
            }else{
                this.push({methods:["parent"], params:[]});
                canNavUp = false;
                if(split[0] != ".")
                    this.push({methods:["children", "get"], params:["", split[0]]});
            }
            for(let i = 1; i < split.length - 1;i++){
                if(split[i] == "")
                    throw new Error(`Path cannot contain consecutive forward slashes "/"`);
                if(split[i] == ".")
                    throw new Error(`"." command can only be used immediately in command`);
                if(split[i] != ".."){
                    this.push({methods:["children", "get"], params:["", split[i]]});
                    canNavUp = false;
                    continue;
                }
                if(!canNavUp)
                    throw new Error(`Cannot nav up ".." after selecting a folder`);
                this.push({methods:["parent"], params:[]});
            }
        }else{
            this.push({methods:["parent"], params:[]});
        }
        this.push({
            methods:["children", "get"], 
            params:[
                fileStringSplit.slice(-1)[0], //type
                fileStringSplit.slice(0,-1).join(".") //name
        ]});
    }
    pushNavUp(){
        if(this.pathLocked)
            throw new Error("Cannot append to a path that is locked");
        if(this.type === ObjectPath.types.absolute)
            throw new Error(`Absolute paths cannot navigate up the path`);
        this.push({methods:["parent"], params:[]});
    }
    relativeTarget(relative = Folder.ROOT){
        if(this.type === ObjectPath.types.relative && relative instanceof Folder)
            throw new Error(`Targets for relative paths start on files, not Folder: ${relative.name}`);
        if(!this.pathLocked)
            console.error(`${ObjectPath.name} is not locked: ${this}`);
        if(this.type === ObjectPath.types.absolute)
            relative = Folder.ROOT;
        let currentEntry = relative;
        for(const identifier of this)
            currentEntry = callByPath(currentEntry, identifier.methods, ...identifier.params);
        return currentEntry
    }
    toJSON(){
        return {
            class: ObjectPath.name,
            path: this
        };
    }
    toPosix(){
        let posix = "/";
        for(const entry of this){
            posix += entry.params[1]
            if(entry.params[0] != ""){
                posix += "." + entry.params[0];
                break;
            }
        }
        return posix;
    }
    static oldlocateFromJSON(path){
        path = Object.hasOwn(path,"class") ? path.path : path;
        let currentEntry = Folder.ROOT;
        for(const identifier of path)
            currentEntry = currentEntry[identifier.getter][identifier.method](...identifier.params);
        return currentEntry;
    }
    static locateFromJSON(path){
        path = Object.hasOwn(path,"class") ? path.path : path;
        let currentEntry = Folder.ROOT;
        for(const identifier of path)
            currentEntry = callByPath(currentEntry, identifier.methods, ...identifier.params);
        return currentEntry;
    }
    static locateFromString(string, relative = Folder.ROOT){
        const path = new ObjectPath(string);
        return path.relativeTarget(relative);
    }
    static #types = Object.freeze({
        relative: new String("relative"),
        absolute: new String("absolute")
    }); 
    static get types(){return this.#types;}
}register(ObjectPath);

class RelativePath extends Array{
    parentCount = null;
    locateFrom(obj){}
    get posix(){
        let posix;
        if(this.parentCount === undefined)
            posix = "/";
        else if (this.parent == 0)
            posix = "./";
        else
            posix = "../".repeat(this.parentCount);
        for(const entry of this){
            posix += entry.params[1]
            if(entry.params[0] != ""){
                posix += "." + entry.params[0];
                break;
            }
        }
        return posix;
    }
}
//#endregion ObjectPath





//#region *****EventListening*****





/*const listeningObjects = new (class extends Map{
    has(object, events = undefined){
        if(events === undefined)
            return super.has(object);
        if(!super.has(object))
            return false;
        if(this.get(object).size == 0)
            return true;
        if(isString(events))
            events = [events];
        return events.every(event => this.get(object).has(event));
    }
    add(object, events = undefined){
        if(!super.has(object))
            this.set(object, new Set());
        if(events == undefined)
            return;
        if(isString(events))
            events = [events];
        events.forEach(event => this.get(object).add(event));
    }
    remove(object, events){
        if(isString(events))
            events = [events];
        if(!super.has(object))
            throw new Error(`Object ${object} not in listeningObjects`);
        events.forEach(event => this.get(object).remove(event));
    }
})();*/
//#region Listening Objects
const newListeningObjects = new (class extends Map{
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
//#endregion listening Objects 


//#region Event Handler
const eventHandler = new (class{
    #activePointers = new Map();
    get activePointers(){return this.#activePointers;}
    #pointerState = "none";
    /** @returns {"none" | "single" | "multi"} */
    get pointerState(){return this.#pointerState}
    get RIGHTCLICKDURATION(){return 500;}
    get TOLERANCESQUARED(){return 100;}
    updatePointerState(){
        if(this.activePointers.size == 0)
            return this.#pointerState = "none";
        if(this.pointerState === "multi")
            return this.#pointerState = "multi";
        return this.#pointerState = (this.activePointers.size > 1) ? "multi" : "single";
    }
    
    eventFired(type, event, call = true){
        if(typeof event.target[type] !== "function")
            return;
        if(call)
            event.target[type](event);
        return event.target;
    }
    //#region __tell listening objects
    _tellListeningObjects(types, event){
        if(isString(types))
            types = [types];
        for(const type of types){
            if(!newListeningObjects.has(type))
                continue;
            newListeningObjects.get(type).forEach(object => {
                if(typeof object[type] !== "function")
                    throw new Error(`Listening object ${object} does not have the method ${type} that it is listening for`);
                if(event.target !== object)
                    object[type](event);
            });
        }
    }
    //#endregion tell listening objects


    //#region __pointerDown
        pointerDown(event){
            //update buttons if another button has been clicked for that pointer
            if(this.activePointers.has(event.pointerId))
                Object.assign(this.activePointers.get(event.pointerId), {buttons: event.buttons});
            else
                this.activePointers.set(event.pointerId, {start:{x: event.clientX, y: event.clientY}, state:"static", downTime: Date.now(), buttons: event.buttons});
            this.updatePointerState();
            event.composedPath()[0].setPointerCapture(event.pointerId);
            this._tellListeningObjects(["globalPointerDown"], event);
            this.eventFired("globalPointerDown", event);
        }
    //#endregion pointerdown


    //#region __pointerUp
        pointerUp(event){
            if(!this.activePointers.has(event.pointerId))
                return;
            let method = "";
            if(this.activePointers.get(event.pointerId).state === "static"){
                if (event.button == 2 || (event.pointerType === "touch" && Date.now() - this.activePointers.get(event.pointerId).downTime > this.RIGHTCLICKDURATION))
                    method = "globalRightClick";
                else if (event.button == 1)
                    method = "globalMiddleClick";
                else if (event.button == 0)
                    method = "globalLeftClick";
            }
            else
                method = "globalPointerDragEnd"
            if(method === "")
                return;
            if(event.buttons == 0){
                this._tellListeningObjects([method], event);
                this.eventFired(method, event);
                this.activePointers.delete(event.pointerId);
                this.updatePointerState();
            }
            else
                Object.assign(this.activePointers.get(event.pointerId), {buttons: event.buttons});
        }
    //#endregion __pointerUp


    //#region __pointerMove
    pointerMove(event){ 
        //checks if it's a plain mouse movement
        if(event.buttons === 0)
            return; //this.pointerHover(event);
        //check pointer is in valid position on screen (i.e. not on the final pixel of the edge)
        //if(event.clientX === 0 || event.clientX === window.innerWidth - 1 || event.clientY === 0 | event.clientY === window.innerHeight - 1)
        //    return this.pointerCancel(event);
        //skip if original target did not have a drag method
        if(event.target === document)
            return;
        
        
        if(this.activePointers.get(event.pointerId).state === "static"){
            const start = this.activePointers.get(event.pointerId).start;
            if((start.x-event.clientX)**2 + (start.y-event.clientY)**2 <= this.TOLERANCESQUARED)
                return;
            
            this.activePointers.get(event.pointerId).state = "moving";
            Object.assign(event, {start:start});
            this.eventFired("globalInitialiseDrag", event);
        }else{
            this._tellListeningObjects("globalPointerDrag", event);
            const target = this.eventFired("globalPointerDrag", event);
            if(target === undefined)
                document.body.setPointerCapture(event.pointerId);
        }
    }
    //#endregion pointerMove
    pointerHover(event){
        this.eventFired(["globalPointerHover"], event);
    }
    pointerOut(event){
        this.eventFired(["globalPointerOut"], event);
    }
    pointerCancel(event){
        this.eventFired(["globalPointerCancel"], event);
    }
    allPointersCancel(event){

    }
    windowBlurred(event){

    }
    keyPressed(event){
        if ((event.ctrlKey || event.metaKey) && ((event.key.toLowerCase() == 'y' && !event.shiftKey ) || (event.shiftKey && event.key.toLowerCase() == 'z')) && !event.altKey) {
            event.preventDefault();
            commandStack.redo()
            return;
        }else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() == 'z'  && !event.altKey) {
            //console.log("undo")
            event.preventDefault();
            commandStack.undo();
            return;
        }else if(event.key === "Escape"){
            this._tellListeningObjects("globalCancel", event);
            this.eventFired("globalCancel", event);
            return;
        }
        this._tellListeningObjects("globalKeyDown", event);
        this.eventFired("globalKeyDown", event);
    }
    input(event){
        this._tellListeningObjects("globalInput", event);
        this.eventFired("globalInput", event);
    }
})();
//#endregion Event Handler
//#region Event listeners
    //pointer
    document.addEventListener("pointerdown", eventHandler.pointerDown.bind(eventHandler));
    document.addEventListener("pointercancel", eventHandler.pointerCancel.bind(eventHandler));
    document.addEventListener("pointerup", eventHandler.pointerUp.bind(eventHandler));
    /*document.addEventListener("pointerrawupdate", (event) => {
        if(event.buttons < eventHandler.activePointers.get(event.pointerId).buttons)
            eventHandler.pointerUp(event);
    });*/
    document.addEventListener("pointermove", eventHandler.pointerMove.bind(eventHandler));
    //document.body.addEventListener("pointerout", eventHandler.pointerOut.bind(eventHandler));
    //keyboard
    document.addEventListener('keydown', eventHandler.keyPressed.bind(eventHandler));
    document.addEventListener("input", eventHandler.input.bind(eventHandler));

    window.addEventListener("blur", (event)=>{
        setTimeout(() => {
            if(document.activeElement === iframe)
                eventHandler._tellListeningObjects("globalLeftClick", {target: document.activeElement});
            else
                eventHandler.windowBlurred.bind(eventHandler)(event);
        })
        
        
    });
//#endregion even listeners
//#endregion Events






//#endregion Global





//#region *******Files*******





//#region Entry



class Entry{
    #parent; #name;
    //#region __construction
    constructor({name, type, parent = Folder.ROOT, children, viewable = false, contentEditable = true, metaEditable = true}){
        if(Folder.ROOT !== "initialising"){
            if(!parent instanceof Folder)
                throw new TypeError("Parent must be of type Folder");
            if(!isString(name) || name.length == 0)
                throw new TypeError("Name must be non-empty a string");
            if(new.target !== Folder && (!isString(type) || type.length ==0))
                throw new TypeError("Type must be a string");
        }
        Object.assign(this, {type, name, parent, children, viewable, contentEditable, metaEditable});
    }
    toJSON(){
        return {
            class: Entry.name,
            name: this.name,
            type: this.type,
            children: this.children,
            viewable: this.viewable,
            contentEditable: this.contentEditable,
            metaEditable: this.metaEditable
        };
    }
    
    pathFromParent(){
        return {
            //getter:"children",
            //method:"get", 
            methods: ["children", "get"],
            params:[this.type, this.name]};
    }
    //#endregion construction
    //#region __getters & setters 
    get parent(){return this.#parent;}
    /**@param {Folder} folder  */
    set parent(folder){
        if (Folder.ROOT === "initialising")
            return this.#parent = folder;
        if(!folder instanceof Folder)
            throw new Error(`${folder} is not a folder`);
        if(this.parent===folder)
            return true;
        if(folder.children.has(this.type, this.name))
            throw new Error(`Target folder ${folder.name} already has a ${this.constructor.name} named ${this.name}${this.type != "" ? ("." + this.type): ""}`);
        if(this.parent !== undefined)
            this.parent.children.delete(this.type, this.name);
        folder.children.set(this.type, this.name, this);
        this.#parent = folder;
    }
    get children(){return this._children;}
    set children(children){this._children = children;}
    get name(){ return this.#name;}
    set name(name){
        if(this.metaEditable === false)
            return false;
        if(name.includes("/"))
            throw new Error(`${this.constructor.name} cannot contain the forward slash character "/"`);
        if(this.parent !== undefined && this.parent.children.has(this.type, name))
            throw new Error(`Parent folder ${this.parent.name} already has a ${this.constructor.name} named ${name}${this.type != "" ? ("." + this.type): ""}`);
        if(this.name !== undefined && this.parent !==undefined){
            this.parent.children.delete(this.type, this.name);
            this.parent.children.set(this.type, name, this);
            if(this.loaded){
                const tab = tabs.files.get(this);
                tab.nameElement.replaceChildren(name);
            }
        }   
        this.#name = name;
    }
    delete(){
        this.parent.children.delete(this.type, this.name);
        //tabs.removeFile(this);
    }
    //#endregion getters and setters
    //#region __statics
        static URLencode(str){
            let encoded = "";
            for (const char of str)
                if(!(char.match(/[A-Z,0-9]/i)!=null || char =='-'|| char == '.' || char == '_' || char == '~'))
                    encoded += "%" + Number(char.charCodeAt()).toString(16);
                else
                    encoded += char;
            return encoded;
        }
    //#endregion statics
}
register(Entry);
//#endregion Entry





//#region File



class File extends Entry{
    //#region __construction
    #loaded = false; #prerender = new SemiString(); #errors = new Set();
    constructor({name, type, parent = Folder.ROOT, children = [], viewable = true, contentEditable = true, metaEditable = true}){
        super({name, type, parent, children, viewable, contentEditable, metaEditable});
    }

    toJSON(){
        return Object.assign(super.toJSON(),{
            class: File.name, 
            children: this.#loaded ? this.children.map(child => child.toJSON()) : this.children,
        });
    }
    //#endregion construction
    //#region __getters & setters
    get childrenElement(){return this._children;}
    get children(){return this.loaded ? Array.from(this.childrenElement.childNodes) : this._children;}
    set children(children){return this._children = children;}
    get errors(){return this.#errors;}
    get loaded(){return this.#loaded;}
    //#endregion getters & setters
    load(){
        if(this.loaded)
            return;
        const childrenArray = this.children.map(child => createFromJSON(Object.assign(child, {file: this})));
        this.children = document.createElement("div");
        this.childrenElement.id = "file-children";
        this.childrenElement.replaceChildren(...childrenArray);
        this.#loaded = true;
    }

    unload(){
        if(!this.loaded)
            return;
        this.children = Array.from(this.children)
        this.#loaded = false;
        this.prerender = this.children.map(child => child.prerender()).join("");// needs to change based on how we handle prerendering
        this.children = this.children.map(child => child.toJSON());
        
    }
    delete(){
        super.delete();
        if(!this.loaded)
            return;
        this.children = [];
        this.#loaded = false;
        tabs.removeFile(this);
    }
    /** @abstract */
    display(){throw new Error("Method display must be implemented");}
    /** @abstract */
    hide(){throw new Error("Method hide must be implemented");}
    get prerender(){return this.#prerender;}
    render(){throw new Error(`method prerender not defined in class ${this.constructor.name}`);}
}
register(File);
//#endregion File





//#region Folder
class Folder extends Entry{
    
    constructor({name, parent = Folder.ROOT, children = [], viewable = false, metaEditable = true}){
        super({name, type: "", parent, children: new NestedMap, viewable, metaEditable});
        children.forEach(child => createFromJSON(Object.assign(child, {parent: this})));
    }
    toJSON(){
        return Object.assign(super.toJSON(),{
            class: Folder.name, 
            children: this.children.toJSON().data,
        });
    }
    get files(){}
    delete(){
        super.delete();
        for(let child of this.children.values())
            child.delete();
    }
    static #ROOT;
    static get ROOT(){
        if(Folder.#ROOT !== undefined) //initialisation of ROOT
            return Folder.#ROOT;
        Folder.#ROOT = "initialising";
        Folder.#ROOT = new Folder({name: "ROOT", parent: Symbol (undefined), metaEditable: false});
        Folder.#ROOT.toJSON = function(){return this.children.toJSON().data};
        return Folder.#ROOT;
    }
}register(Folder);
//#endregion Folder


//#endregion Files

class CustomError extends HTMLElement{
    constructor(){
        super();
    }
    /**@param {HTMLElement} element */
    static createError(element){
        const custError = document.createElement(CustomError.tag);
        this.fileType = element.file.type;
        element.replaceWith(custError);
        custError.append(element);

    }
    remove(){

    }
    updatePosition(){

    }
    static get tag(){return "cust-error"}
}customElements.define(CustomError.tag, CustomError)
register(CustomError);



//#region ****Block Class***




class Block extends HTMLElement{
    //#region construction
    #file; #childrenElement; #draggable;
    constructor(){
        super();
        Object.defineProperty(this, "_internals", {value: this.attachInternals(),enumerable: false,writable: true,configurable: true});
        Object.defineProperty(this, "globalInitialiseDrag", {value: undefined,enumerable: false,configurable: true});
        Object.defineProperty(this, "globalPointerDrag", {value: undefined,enumerable: false,configurable: true});
        Object.defineProperty(this, "globalPointerDragEnd", {value: undefined,enumerable: false,configurable: true});
        Object.defineProperty(this, "globalPointerCancel", {value: undefined,enumerable: false,configurable: true});
    }
    /*static createFromJSON({children = [], file, type, status, draggable = true, canAppendChild = true, canPrepend = true, canAfter = true}){
        const block = document.createElement(this.tag);//"custom-block");
        //block.createSlots();
        Object.assign(block, {file, type: Block.type[type], status: Block["status_"+status], draggable, canAppendChild, canPrepend, canAfter} )

        //potentially here the _childrenElement should be div or span element dependant
        block.children = children.map(child => createFromJSON(Object.assign(child, {file: file})));
        block.appendChild(block.childrenElement);

        return block;
    }*/
    static createFromJSON(JSON){
        delete JSON.class;
        const block = document.createElement(this.tag);
        const defaults = {status: Block.status.placed, draggable: true, canAfter: true, canPrepend:true, children: []};
        //workaround as HTML Block properties need to be assigned first, namely attributes need to be created before the children;
        const temp = {}
        Object.assign(temp, JSON, defaults, JSON);
        if(!isString(temp.children))
            temp.children.forEach(child => Object.assign(child, {file: temp.file}));
        Object.assign(block, temp);
        return block;
    }
    toJSON(){
        return{
            class: "Block",
            children: this.children.map(child => child.toJSON()),
            size: this.size,
            status: this.status,
            draggable: this.draggable,
            canPrepend: this.canPrepend,
            canAfter: this.canAfter
        };
    }
    unload(){
        //get JSON of the block and prerender

        //return {JSON: , prerender: }
    }
    //#endregion construction





    //#region getters & setters
    get file(){return this.#file;}
    set file(newFile){
        if(newFile === undefined)
            return;
        if(newFile instanceof ObjectPath)
            newFile = newFile.target;
        if(newFile===this._file)
            return;
        if(!newFile instanceof File)
            throw new Error(`option file must be a file or path to a file, instead file was ${file}`);
        this.#file = newFile;
    }
    get childrenElement(){
        if(this.#childrenElement != null)
            return this.#childrenElement

        this.#childrenElement = this.querySelector("div[slot='children']");
        if(this.#childrenElement != null)
            return this.#childrenElement

        this.#childrenElement = document.createElement("div");
        this.#childrenElement.slot = "children";
        this.append(this.#childrenElement);
        return this.#childrenElement;
    }
    get children(){ return Array.from(this.childrenElement.children);}
    set children(children){
        this.childrenElement.replaceChildren(
            ...children.map(child =>
                isJSONObject(child)
                ? createFromJSON(child)
                : child
            )
        );
    }

    get draggable(){return this.#draggable;}
    set draggable(bool){
        this.#draggable = bool;
        bool? delete this.globalInitialiseDrag
            : Object.defineProperty(this, "globalInitialiseDrag", {value: undefined,enumerable: false,configurable: true});
    }

    get folded(){return this._internals.states.has("folded")}
    set folded(bool){this._internals.states[bool? "add" : "delete"]("folded");}

    get parent(){
        let parent = this.parentNode;
        if (parent.nodeName == "DIV" && parent.slot == "children") //check if parent is a content block
            parent = parent.parentNode;
        else if(parent.nodeName == "DIV" && parent.id == "file-children")
            parent = this.file;
        return parent; 
    }
    //#endregion getters and setters




    //#region Method Overrides
    prepend(floatingBlock){
        this.childrenElement.prepend(floatingBlock);
        floatingBlock.file = this.file;
    }
    after(floatingBlock){
        HTMLElement.prototype.after.call(this, floatingBlock);
        floatingBlock.file = this.file;
    }
    remove(){
        this.removeEvents();
        HTMLElement.prototype.remove.call(this);
    }
    //#endregion overrides

    //#region DOM-like methods
        /**@param {Block} block  */
        appendChild(block){
            if(isJSONObject(block))
                block = createFromJSON(block);
            if(!block instanceof Block && block !== Block.placeholder)
                throw new Error(`${block} is not a Block instance.`);
            this.childrenElement.appendChild(block);
        }
        /** @returns {Block} */
        cloneBlock(opts = {}, newValues = {}){
            //const flags = {name: true, size: true, status: true, file: true, draggable: true};
            //Object.assign(flags, opts);
            const clone = this.cloneNode(true);
            //if(Object.keys(flags).length > 0)
            this._pasteFeaturesTo(clone, opts, newValues);
            return clone;
        }
        _pasteFeaturesTo(block, opts = {}, newValues = {}){
            const flags = Object.fromEntries(Object.keys(this).map(key => [key, true])); 
            //const flags = {name: true, type: true, status: true, file: true, draggable: true, folded: true};
            Object.assign(flags, this.constructor.setters, opts);
            for(const key in flags)
                if(flags[key])
                    block[key] = this[key]; 
            for(const key in newValues)
                block[key] = newValues[key];
            //recursive calls
            for (let child = 0; child < this.children.length; child++)
                if(isFunction((this.children[child])._pasteFeaturesTo))
                    (this.children[child])._pasteFeaturesTo(block.children[child], flags);
        }
        removeEvents(){
            for(const child of this.children)
                if(isFunction(child.removeEvents))
                    child.removeEvents();
        }
    //#endregion DOMlike methods

    //#region general methods
        prerender(){throw new Error(`method prerender not defined in ${this.constructor.name}`);}
        pathFromParent(){
            //method called by object path to appropriately navigate from the parent to the object
            return {
                //getter:"children", 
                //method:"at", 
                methods: ["children", "at"],
                params:[this.parent.children.indexOf(this)]
            }; 
        }
    //#endregion general methods
        
    //#region Pointer Handling





        //#region __globalInitialiseDrag
            globalInitialiseDrag(event){
                const part = event.originalTarget.getAttribute("part")
                if(part !=null && (part !="top" && part !="left" && part !="bottom"))
                    return;
                const isPlaced = this.isStatus(Block.status.placed);
                //initialise in progress command for moving placed blocks 
                if(!isPlaced)
                    commandStack.inProgress.undo.methods = ["remove"];
                //setup cloning block
                
                const rect = this.getBoundingClientRect();
                const block = isPlaced ? this : this.cloneBlock({name:true, type: true});
                Object.assign(block.style, {left: rect.left +"px", top: rect.top+"px"});
                block.status = Block.status.floating;
                if(!isPlaced)
                    document.body.appendChild(block);
                
                block.offset = {x: event.clientX - rect.left, y: event.clientY - rect.top};
                //set the new block to be the target for pointer events
                block.setPointerCapture(event.pointerId);
                //set methods for the global event handler
                block.#dragging(true);
                Block.placeholder = block;
            }
        //#endregion globalInitialiseDrag


        //#region __globalPointerDrag
            globalPointerDrag(event){
                const floatingBlock = this;
                const coord = new Coord(Math.round(event.clientX - this.offset.x), Math.round(Math.max(event.clientY-this.offset.y,0)));
                //update floating block position
                Object.assign(floatingBlock.style, {left: coord.x + "px", top: coord.y + "px"});
                //remove placeholder from render
                Block.placeholder.style.display = 'none';
                const {placedBlock, method} = floatingBlock.calculateBlockPlacement(coord);
                if(placedBlock && method != "remove")
                    placedBlock[method](Block.placeholder);
                else
                    Block.placeholder.remove();
                Block.placeholder.removeAttribute("style");
            }
        //#endregion globalPointerDrag
        /** @param {Coord} coord */
        calculateBlockPlacement(coord){
            const floatingBlock = this;
            //only calculate if floating block is in the editor
            const fileChildren = document.getElementById("file-children");
            const fileChildrenRect = fileChildren.getBoundingClientRect();
            //outside of editor box
            let placedBlock, method = "deleteBlock";
            if(!coord.isIn(fileChildrenRect))
                return {placedBlock, method};
            placedBlock = document.elementFromPoint(coord.x-1, coord.y-1);
            if(isFunction(placedBlock.getPlacedBlock))
                placedBlock = placedBlock.getPlacedBlock(coord);
            placedBlock = placedBlock.status !== Block.status.template ? placedBlock : undefined;

            if(placedBlock && isFunction(placedBlock.getMethod))
                method = placedBlock.getMethod(floatingBlock, coord);
            else{
                //maybe here for calculating line append?
                placedBlock = undefined;
            }
            return {placedBlock, method};
        }
        getPlacedBlock(coord){return this;}
        getMethod(floatingBlock, coord){
            if(!coord instanceof Coord)
                coord = new Coord(coord.x, coord.y);
            Object.assign(coord, {x:coord.x-1, y:coord.y-1});
            const placedBlock = this;
            if(placedBlock.size === Block.size.statement)
                return this.canAfter ? "after" : "remove";
            const part = placedBlock.shadowRoot.elementFromPoint(...coord);
            const topPart = placedBlock.shadowRoot.childNodes[0];
            if(part === topPart)
                return this.canPrepend ? "prepend" : "remove";
            const bottomPart = placedBlock.shadowRoot.childNodes[2];
            if(part === bottomPart)
                return this.canAfter ? "after" : "remove";
            return "remove";
        }
        appendToLine(coord){
            //throw new Error("Abstract method not in class");
        }
        //#region __globalPointerDragEnd
            globalPointerDragEnd(event){
                const floatingBlock = this;
                const coord = new Coord(event.clientX - this.offset.x -1, Math.max(event.clientY-this.offset.y,0));
                Block.placeholder.remove();
                const isFromTemplate = commandStack.inProgress.undo.methods.length > 0;
                const {placedBlock, method} = floatingBlock.calculateBlockPlacement(coord);
                const blockAdded = placedBlock && method != "remove";

                // adding commands
                if(blockAdded && isFromTemplate){
                    //commandStack.inProgress.undo.object
                    commandStack.inProgress.undo.methods =["remove"];
                    //~commandStack.inProgress.undo.args~
                    const placedPath = new ObjectPath(placedBlock);
                    commandStack.inProgress.redo.object = () => placedPath.target;
                    commandStack.inProgress.redo.methods = [method];
                    const floatingJSON = Object.assign(floatingBlock.toJSON(), {status: Block.status.placed});
                    commandStack.inProgress.redo.args = [() => createFromJSON(floatingJSON)];

                    placedBlock[method](floatingBlock);
                    floatingBlock.status = Block.status.placed;

                    const floatingPath = new ObjectPath(floatingBlock);
                    commandStack.inProgress.undo.object = () => floatingPath.target;

                    this.file.clearPrerender();
                }else if (blockAdded && !isFromTemplate){
                    let olderSibling = floatingBlock.previousElementSibling;
                    
                    commandStack.inProgress.undo.methods = olderSibling ? ["after"] : ["prepend"];
                    olderSibling = olderSibling ? olderSibling : floatingBlock.parent;
                    if(placedBlock == olderSibling && method == commandStack.inProgress.undo.methods[0])
                        return floatingBlock.globalCancel();
                    //commandStack.inProgress.undo.args
                    const placedPath = new ObjectPath(placedBlock);
                    commandStack.inProgress.redo.object = () => placedPath.target;
                    commandStack.inProgress.redo.methods = [method];
                    const postFloatPath = new ObjectPath(floatingBlock);
                    commandStack.inProgress.redo.args = [() => postFloatPath.target];
                    

                    placedBlock[method](floatingBlock);
                    floatingBlock.status = Block.status.placed;
                    const olderSiblingPath = new ObjectPath(olderSibling);
                    commandStack.inProgress.undo.object = () => olderSiblingPath.target;

                    const preFloatPath = new ObjectPath(floatingBlock);
                    commandStack.inProgress.undo.args = [() => preFloatPath.target];
                    
                    this.file.clearPrerender();
                }else if (!blockAdded && !isFromTemplate){
                    let olderSibling = floatingBlock.previousElementSibling;
                    commandStack.inProgress.undo.object  = olderSibling ? olderSibling : floatingBlock.parent;
                    commandStack.inProgress.undo.methods = olderSibling ? ["after"] : ["prepend"];
                    const floatingJSON = Object.assign(floatingBlock.toJSON(), {status: Block.status.placed});
                    commandStack.inProgress.undo.args    = [() => createFromJSON(floatingJSON)];
                    const floatingPath = new ObjectPath(floatingBlock);
                    commandStack.inProgress.redo.object  = () => floatingPath.target;
                    commandStack.inProgress.redo.methods = ["remove"];
                    //commandStack.inProgress.redo.args    =

                    (olderSibling ? olderSibling : floatingBlock.parent).file.clearPrerender();
                    floatingBlock.remove();
                }else{ //template block deleted
                    commandStack.inProgress.clear();
                    floatingBlock.remove();
                }
                commandStack.inProgress.push();
                this.#dragging(false);
            }
        //#endregion __globalPointerDragEnd
        //#region __globalPointerCancel
            globalPointerCancel(){
                Block.placeholder.remove();
                if(commandStack.inProgress.undo.methods == ["deleteBlock"]){
                    //block came from template
                    this.remove();
                }else{ 

                }
                commandStack.inProgress.clear();
                this.#dragging(false);
            }
        //#endregion globalpointercancel
            #dragging(bool){
                if(bool){
                    delete this.globalPointerDrag;
                    delete this.globalPointerDragEnd;
                    delete this.globalPointerCancel;
                    Object.defineProperty(this, "globalInitialiseDrag", {value: undefined,enumerable: false,configurable: true});
                }else{
                    Object.defineProperty(this, "globalPointerDrag", {value: undefined,enumerable: false,configurable: true});
                    Object.defineProperty(this, "globalPointerDragEnd", {value: undefined,enumerable: false,configurable: true});
                    Object.defineProperty(this, "globalPointerCancel", {value: undefined,enumerable: false,configurable: true});
                    delete this.globalInitialiseDrag;
                }
            }
            globalCancel(){
                const floatingBlock = this;
                commandStack.inProgress.clear();
                floatingBlock.status = Block.status.placed;
                floatingBlock.#dragging(false);
            }
    
    //#endregion pointer handling





    //#region size, type & status





        //#region __size
            static #size = Object.seal({
                container: new String("container"),
                statement: new String("statement")
            });
            static {for(const key in this.#size)Object.freeze(this.#size[key]);};
            static get size(){return Block.#size;}
            get validSizes(){return Object.values(Block.size)}
            isValidSize(query){return this.validSizes.includes(query)}
            /**@returns {Block.size} */
            get size(){
                const sizesSet = [];
                this.validSizes.forEach(value => {
                    if(this._internals.states.has(value))
                        sizesSet.push(value);
                })
                if(sizesSet.length > 1)
                    throw new Error(`Block has multiple types: ${sizesSet}\n${this}`);
                return sizesSet[0];
            }
            set size(newSize){
                if(newSize === undefined)
                    return;
                if(!this.isValidSize(newSize))
                    throw new Error(`Type ${newSize} not valid.\nValid types are: ${this.validTypes}`)
                this.validSizes.forEach(size => this._internals.states.delete(size));
                this._internals.states.add(newSize);
            }
        //#endregion __size

        //#region __type
            get validTypes(){
                if(this.constructor.type)
                    return Object.values(this.constructor.type);
                return Object.values(HTMLBlock.type);
            }
            isValidType(queryType){return this.validTypes.includes(queryType);}
            //** @returns {(this.constructor).type} */
            get type(){
                const types = this.validTypes.filter(type => this._internals.states.has(type));
                /*const typesSet = [];
                for(const value of this.validTypes)
                    if(this._internals.states.has(value))
                        typesSet.push(value);*/
                if(types.length > 1)
                    throw new Error(`Block has multiple types: ${types}\n${this}`);
                return types[0];
            }
            set type(newType){
                if(!this.isValidType(newType)){debugger;
                    throw new Error(`Type ${newType} not valid for ${this.name}.\nValid types are: ${this.validTypes}`)}
                this.validTypes.forEach(type => this._internals.states.delete(type));
                this._internals.states.add(newType);
            }
        //#endregion __type

        //#region __status
            static #status = Object.freeze({
                   template: new String("template"),
                     placed: new String("placed"),
                placeholder: new String("placeholder"),
                   floating: new String("floating")
            });
            static {for(const key in this.#status)Object.freeze(this.#status[key]);};
            static get status(){return Block.#status;}
            get validStati(){return Object.values(Block.status)}
            isValidStatus(query){return this.validStati.includes(query)}
            /**@returns {Block.status} */
            get status(){
                const stati = this.validStati.filter(status => this._internals.states.has(status));
                if(stati.length > 1)
                    throw new Error("Block has multiple statuses: ", stati, "\n", this);
                if(stati.length == 0)
                    return;
                return stati[0];
            }
            set status(status){
                if(!this.isValidStatus(status)){debugger;
                    throw new Error(`Status ${status} not valid for ${this.name}.\nValid types are: ${this.validStati}`)}
                this.validStati.forEach(status => this._internals.states.delete(status));
                this._internals.states.add(status);
                if(status === Block.status.placed)
                    this.removeAttribute("style");
            }
            isStatus(query){return this._internals.states.has(query)}
        //#endregion __status
    //#endregion size, type & status

    //#region static
        static #placeholder= document.createElement("span");
        static {
            Block.#placeholder.id = "placeholder";
            Object.defineProperty(Block.#placeholder, "calculateBlockPlacement",{
                value: Block.prototype.calculateBlockPlacement,
                configurable: false,
                writable: false
            });
            Object.defineProperty(Block.#placeholder, "type", {
                get(){return this.firstChild? this.firstChild.type : undefined},
                configurable: false,
            });
        }
        
        static get placeholder(){return Block.#placeholder;}
        /** @param {Block} block */
        static set placeholder(block){
            if(!block instanceof Block)
                throw new Error(`Placeholder can only be set to a Block instance`);
            const clone = block.cloneBlock({type:true}, {status: Block.status.placeholder});
            Block.#placeholder.replaceChildren(clone);
        }
        static setters = Object.fromEntries(
            Object.entries(Object.getOwnPropertyDescriptors(this.prototype))
            .filter(([key, desc]) => typeof desc.set === "function")
            .map(([key]) => [key, true])
        );
        static {delete this.setters.children;}
    //#endregion static
}
customElements.define("custom-block", Block);
register(Block);
//#endregion **Block CLass**





//#region *******HTML******





//#region HTML File



class HTMLFile extends File{
    //#region __construction
    #classes= new HTMLFile.#ClassMap(); #ids = new HTMLFile.#IdSet();
    constructor({name, parent = Folder.ROOT, children = defaultJSON.files[0].children, viewable = true, contentEditable = true, metaEditable = true}){
        super({name, type:"html", parent, children, viewable, contentEditable, metaEditable});
    }

    static populateTemplatePanel(JSON){
        HTMLFile.#templatePanel.id = "html-template-panel";
        for(const containerJSON of JSON){
            const container = document.createElement("div");
            container.id = containerJSON.id;
            container.replaceChildren(...containerJSON.children.map(child => 
                createFromJSON(Object.assign({class:HTMLBlock.name, name:child, status:Block.status.template}, HTMLBlock.propertiesByName[child]))
            ));
            HTMLFile.#templatePanel.append(container);
        }
    }
    //#endregion construction
    get classes(){return this.#classes}
    get ids(){return this.#ids;}
    
    display(){
        const editor = document.getElementById("editor");
        editor.setAttribute("data-file-type", "html");
        editor.appendChild(HTMLFile.#templatePanel);
        editor.appendChild(this.childrenElement);
        //editor.replaceChildren(...this.children);
    }
    hide(){

    }
    
    get prerender(){
        let prerender = super.prerender;
        if(prerender.length >0)
            return prerender;
        this.children.forEach(child => prerender.push(...child.prerender()));
        return prerender;
    }
    clearPrerender(){super.prerender.clear()}
    render(){return this.prerender.reduce((accumulator, currentValue) => accumulator + isString(currentValue)? currentValue: currentValue.target.render(),"");}
    //#region __statics
        static #templatePanel= document.createElement("div");
        static #allClasses = new CountMap(); 
        static #allIds = new CountMap();
        static #ClassMap = class ClassMap extends CountMap{
            decrement(...objs){objs.forEach(obj => {if(super.decrement(obj) == 0) HTMLFile.allClasses.decrement(obj)});}
            increment(...objs){objs.forEach(obj => {if(super.increment(obj) == 1) HTMLFile.allClasses.increment(obj)});}
        }
        static #IdSet = class IdSet extends Set{
            add(obj){
                if(this.has(obj))
                    return false;
                super.add(obj);
                HTMLFile.allIds.increment(obj);
            }
            delete(obj){
                if(!this.has(obj))
                    return false;
                super.delete(obj);
                HTMLFile.allIds.decrement(obj);
            }
        }
        static get allClasses(){return HTMLFile.#allClasses;}
        static get allIds(){return HTMLFile.#allIds}
        static get templatePanel(){return HTMLFile.#templatePanel;}
    //#endregion statics
}register(HTMLFile);
//#endregion HTML File



//#region HTML Block





//#region __html block template
const htmlBlockTemplate = (function(){
    const template = document.getElementById("html-block");
    template.content.childNodes.forEach(node => {
        if(node.nodeName == "#text")
            node.remove();
    })
    return template;
})();
//#endregion html block template




class HTMLBlock extends Block{
    //#region __construction
    #newAttributeSpan; #attributesElement; #canAddAttributes;
    constructor(){
        super();
        //clone template and attach to shadow root
        const clone = htmlBlockTemplate.content.cloneNode(true);
        const shadowRoot = this.attachShadow({ mode: "open"});
        //storing the new-attribute span in instance
        this.#newAttributeSpan = clone.childNodes[0].childNodes[2];
        this.#newAttributeSpan.show = function(){this.removeAttribute("style")};
        this.#newAttributeSpan.hide = function(){this.style.display = "none"};
        shadowRoot.appendChild(clone);
    }
    /**
     * @param {Object} options 
     * @param {string} options.name - the name of the element
     * @param {HTMLFile} options.file - the reference to the HTML file containing the block
     * @param {HTMLAttribute[]} [options.attributes] - an array of HTMLAttribute JSON objects
     * @param {(Block|HTMLBlock)[]} [options.children] - an array of children blocks
     * @param {"placed" | "template" | "floating"} [options.status="placed"]
     * @param {boolean} [options.draggable=true] - sets if the element is draggable
     * @param {boolean} [options.canAddAttributes=true] - set if the element can have attributes added to it
     * @returns {HTMLBlock}
     */
    /*static createFromJSON(options){
        const elementProperties = HTMLBlock.propertiesByName[options.name];
        if(elementProperties === undefined)
            throw new Error(`Element name: "${options.name}" is not a valid element name.`);
        const defaultOptions = {attributes: [], children: [], allowedChildrenTags: [], blockedChildrenTags: [], invalidTypes: [], status: "placed", draggable: true, canAddAttributes: true, canAfter: true, canPrepend: true};
        //const block = options.name != "br" ? document.createElement(HTMLBlock.tag) : document.createElement(HTMLBreakElement.tag);
        const block = document.createElement(this.tag);
        delete options.class;
        Object.assign(defaultOptions, elementProperties, options);
        Object.assign(defaultOptions, {status: Block.status[defaultOptions.status]});
        defaultOptions.attributes.forEach(attr => Object.assign(attr, {file: defaultOptions.file, hoverable: defaultOptions.canAddAttributes}))
        //Object.assign(defaultOptions.attributes, {file: defaultOptions.file, hoverable: defaultOptions.canAddAttributes});
        defaultOptions.children.forEach(child => Object.assign(child, {file: defaultOptions.file}));
        Object.assign(block, defaultOptions);
        return block;
    }*/
    static createFromJSON(JSON){
        const elementProperties = HTMLBlock.propertiesByName[JSON.name];
        if(elementProperties === undefined)
            throw new Error(`Element name: "${JSON.name}" is not a valid element name.`);
        const defaults = {attributes: [], canAddAttributes: true, allowedChildrenTags: [], blockedChildrenTags: [], invalidTypes: []};
        Object.assign(defaults, elementProperties, JSON);
        defaults.attributes.forEach(attr => Object.assign(attr, {file: defaults.file}))//, hoverable: defaults.canAddAttributes}))
        const block = super.createFromJSON(defaults);
        return block;
    }
    
    toJSON(){
        return Object.assign(super.toJSON(), {
            class: HTMLBlock.name,
            name: this.name,
            type: this.type,
            attributes: this.attributes.map(attribute => attribute.toJSON()),
            canAddAttributes: this.canAddAttributes
        });
    }
    //#endregion construction
    




    //#region __getters& Setters
    get name(){return this.getAttribute("data-element");}
    set name(name){
        this.setAttribute("data-element", name);
        this.shadowRoot.children[0].childNodes[0].data = "<"+name;
        this.shadowRoot.children[2].childNodes[0].data = "</"+name+">";
        if(name === "head"){
            const tempprerender = this.prerender;
            this.prerender = () =>{
                const pre = tempprerender.call(this);
                pre[pre.length-1] = pre[pre.length-1].replace("</head>", iframeAnchorScript + "</head>");
                return pre;
            }
        }
            
    }
    get newAttributeSpan(){return this.#newAttributeSpan;}
    /**@returns {HTMLElement} */
    get attributesElement(){
        if(this.#attributesElement != null)
            return this.#attributesElement;
        //check if the attribute element exists without reference
        this.#attributesElement = this.querySelector("span[slot='attributes']");
        if(this.#attributesElement !=null)
            return this.#attributesElement;
        //create the attribute element
        this.#attributesElement = document.createElement("span");
        this.#attributesElement.slot = "attributes";
        this.append(this.#attributesElement);
        return this.#attributesElement;
    }
    /** @returns {HTMLAttribute[]} */
    get attributes(){ return Array.from(this.attributesElement.children);}
    set attributes(attributes){
        this.attributesElement.replaceChildren(
            ...attributes.map(attribute =>
                attribute instanceof HTMLAttribute
                    ? attribute
                    : createFromJSON(attribute)
            )
        );
    }
    
    get canAddAttributes(){return this.#canAddAttributes;}
    set canAddAttributes(bool){
        this.#canAddAttributes = bool;
        this.addAttributesEvents(bool && this.status === Block.status.placed);
    }
    addAttributesEvents(bool){
        //this.shadowRoot.childNodes[0].onmouseleave = bool ? this._hideNewAttributeSpan.bind(this): undefined; 
        this.shadowRoot.childNodes[0].onmouseleave = bool ? this.newAttributeSpan.hide.bind(this.newAttributeSpan): undefined; 
        //this.shadowRoot.childNodes[0].onmouseover  = bool ? this._showNewAttributeSpan.bind(this): undefined; 
        this.shadowRoot.childNodes[0].onmouseover = bool ? this.newAttributeSpan.show.bind(this.newAttributeSpan): undefined; 
        !bool? delete this.globalLeftClick 
            : Object.defineProperty(this.globalLeftClick, "globalLeftClick", {
                value: undefined,
                enumerable: false,
                configurable: true
            });
    }
    get folded(){return super.folded;}
    set folded(bool){
        super.folded = bool;
        this.addAttributesEvents(!bool);
    }
    
    //#endregion getters & setters





    //#region __DOMlike
        newAttribute(){
            const newAttr = HTMLAttribute.createFromJSON({file: this.file});
            this.attributesElement.appendChild(newAttr);
            //newAttr.nameSpan.globalLeftClick();
            newAttr.nameSpan.select();
        }
        appendAttribute(attribute){
            if(!attribute instanceof HTMLAttribute)
                throw new Error(`${attribute} is not an HTMLAttribute instance`);
            Object.assign(attribute, {file: this.file});
            this.attributesElement.appendChild(attribute);
        }
        removeEvents(){
            this.addAttributesEvents(false);
            this.attributes.forEach(attribute => attribute.removeEvents());
            super.removeEvents();
        }
    //#endregion DOM like

    //#region __Rendering
    prerender(){
        const semistring = new SemiString();
        semistring.push("<"+this.name);
        this.attributes.forEach(attribute => semistring.push(...attribute.prerender()));
        semistring.push(">");
        this.children.forEach(child => child.nodeName == "BR" ? "" :semistring.push(...child.prerender()));
        if(this.size !== Block.size.statement)
            semistring.push("</" +this.name+">");
        return semistring;
    }
    //#endregion __Rendering

    //#region __event methods
    globalLeftClick(event){
        if(event.composedPath()[0] === this.newAttributeSpan){
            //new attribute code
            this.newAttribute();
        }
    }
    //_showNewAttributeSpan(){this.newAttributeSpan.removeAttribute("style");}
    //_hideNewAttributeSpan(){this.newAttributeSpan.style.display = "none";}
    getMethod(floatingBlock, coord){
        const method = super.getMethod(floatingBlock, coord);
        if(method != "prepend")
            return method;
        const placedBlock = this;
        if(placedBlock.type === HTMLBlock.type.inline && floatingBlock.type === HTMLBlock.type.block)
            return "remove";
        if(placedBlock.type === HTMLBlock.type.phrasingonly && floatingBlock.type !== HTMLBlock.type.inline)
            return "remove";
        return "prepend";
    }
    //#endregion event methods





    //#region __type & status
        static #type = Object.seal({
            ["block"]: new String("block"),
            ["inline"]: new String("inline"),
            ["transparent"]: new String("transparent"),
            ["phrasingonly"]: new String("phrasingonly")
        });
        static get type(){return HTMLBlock.#type;}
        get type(){
            const type = super.type;
            if(type !== HTMLBlock.type.transparent)
                return type;
            //if transparent has block children then it is block
            return this.children.some(child => child.type === HTMLBlock.type.block) 
                ? HTMLBlock.type.block
                : HTMLBlock.type.inline;
        }
        set type(newType){super.type = newType;}

        get status(){return super.status;}
        set status(newStatus){
            super.status = newStatus;
            this.addAttributesEvents(newStatus === Block.status.placed && this.canAddAttributes && !this.folded);
        }
    //#endregion type & status





    //#region __statics
    static setters = Object.fromEntries(
        Object.entries(Object.getOwnPropertyDescriptors(this.prototype))
        .filter(([key, desc]) => typeof desc.set === "function")
        .map(([key]) => [key, true])
    );
    static {Object.assign(this.setters, Block.setters);delete this.setters.children; delete this.setters.attributes}
    static get propertiesByName(){
        return {
        //Text
            text: {class: HTMLText.name, children: "Text"},
            h1: {size: Block.size.container, type: HTMLBlock.type.block},
            h2: {size: Block.size.container, type: HTMLBlock.type.block},
            h3: {size: Block.size.container, type: HTMLBlock.type.block},
            h4: {size: Block.size.container, type: HTMLBlock.type.block},
            h5: {size: Block.size.container, type: HTMLBlock.type.block},
            h6: {size: Block.size.container, type: HTMLBlock.type.block},
            p: {size: Block.size.container, type: HTMLBlock.type.phrasingonly, invalidTypes: []},
            a: {size: Block.size.container, type: HTMLBlock.type.transparent, attributes:[{class:HTMLAttribute.name, name:"href", value:"", nameEditable:false}]},
            br: {class: HTMLBreakElement.name, size: Block.size.statement, type: HTMLBlock.type.inline},
            hr: {size: Block.size.statement, type: HTMLBlock.type.block},
            b: {size: Block.size.container, type: HTMLBlock.type.inline},
            del: {size: Block.size.container, type: HTMLBlock.type.inline},
            em: {size: Block.size.container, type: HTMLBlock.type.inline},
            i: {size: Block.size.container, type: HTMLBlock.type.inline},
            mark: {size: Block.size.container, type: HTMLBlock.type.inline},
            q: {size: Block.size.container, type: HTMLBlock.type.inline},
            s: {size: Block.size.container, type: HTMLBlock.type.inline},
            small: {size: Block.size.container, type: HTMLBlock.type.inline},
            sub: {size: Block.size.container, type: HTMLBlock.type.inline},
            sup: {size: Block.size.container, type: HTMLBlock.type.inline},
            u: {size: Block.size.container, type: HTMLBlock.type.inline},
        //Formatting
        //Layout
            header: {size: Block.size.container, type: HTMLBlock.type.block},
            main: {size: Block.size.container, type: HTMLBlock.type.block},
            footer: {size: Block.size.container, type: HTMLBlock.type.block},
            article: {size: Block.size.container, type: HTMLBlock.type.block},
            aside: {size: Block.size.container, type: HTMLBlock.type.block},
            details: {size: Block.size.container, type: HTMLBlock.type.block},
            dialog: {size: Block.size.container, type: HTMLBlock.type.block},
            section: {size: Block.size.container, type: HTMLBlock.type.block},
            search: {size: Block.size.container, type: HTMLBlock.type.block},
            summary: {size: Block.size.container, type: HTMLBlock.type.phrasingonly},
        //Forms
            form: {size: Block.size.container, type: HTMLBlock.type.block},
            input: {type: HTMLBlock.type.inline, attributes:[{class:HTMLAttribute.name, name:"type", value:"", nameEditable: false}]},
            textarea: {size: Block.size.container, type: HTMLBlock.type.inline},
            button: {size: Block.size.container, type: HTMLBlock.type.inline},
            select: {size: Block.size.container, type: HTMLBlock.type.block},
            optgroup: {size: Block.size.container, type: HTMLBlock.type.block},
            option: {size: Block.size.container, type: HTMLBlock.type.inline},
            label: {size: Block.size.container, type: HTMLBlock.type.inline},
            fieldset: {size: Block.size.container, type: HTMLBlock.type.block},
            legend: {size: Block.size.container, type: HTMLBlock.type.phrasingonly},
            datalist: {size: Block.size.container, type: HTMLBlock.type.block},
            output: {size: Block.size.container, type: HTMLBlock.type.inline},
        //Media
            img: {size: Block.size.statement, type: HTMLBlock.type.inline, attributes:[{class:HTMLAttribute.name, name:"src", value:"", nameEditable:false}, {class:HTMLAttribute.name, name:"alt", value:"", nameEditable:false}]},
            figure: {size: Block.size.container, type: HTMLBlock.type.block},
            figcaption: {size: Block.size.container, type: HTMLBlock.type.phrasingonly},
            map: {size: Block.size.container, type: HTMLBlock.type.transparent},
            picture: {size: Block.size.container, type: HTMLBlock.type.block},
            audio: {size: Block.size.container, type: HTMLBlock.type.block},
            video: {size: Block.size.container, type: HTMLBlock.type.block},
            source: {size: Block.size.statement, type: HTMLBlock.type.block},
        //lists
            ul: {size: Block.size.container, type: HTMLBlock.type.block},
            ol: {size: Block.size.container, type: HTMLBlock.type.block},
            li: {size: Block.size.container, type: HTMLBlock.type.inline},
            dl: {size: Block.size.container, type: HTMLBlock.type.block},
            dt: {size: Block.size.container, type: HTMLBlock.type.phrasingonly},
            dd: {size: Block.size.container, type: HTMLBlock.type.phrasingonly},
        //Tables
            table: {size: Block.size.container, type: HTMLBlock.type.block},
            caption: {size: Block.size.container, type: HTMLBlock.type.phrasingonly},
            th: {size: Block.size.container, type: HTMLBlock.type.inline},
            tr: {size: Block.size.container, type: HTMLBlock.type.block},
            td: {size: Block.size.container, type: HTMLBlock.type.inline},
            thead: {size: Block.size.container, type: HTMLBlock.type.block},
            tbody: {size: Block.size.container, type: HTMLBlock.type.block},
            tfoot: {size: Block.size.container, type: HTMLBlock.type.block},
            colgroup: {size: Block.size.container, type: HTMLBlock.type.block},
            col: {size: Block.size.statement, type: HTMLBlock.type.block},
        //Meta
            "!DOCTYPE": {size: Block.size.statement, type:HTMLBlock.type.block, attributes:[{class: "HTMLAttribute", name:"html", nameEditable: false, valueEditable: false}], draggable: false, canAddAttributes: false},
            html: {size:Block.size.container, type: HTMLBlock.type.block, attributes: [{class:"HTMLAttribute", name: "lang", value:"en", nameEditable: false}], draggable: false, canAddAttributes: false},
            head: {size:Block.size.container, type: HTMLBlock.type.block, draggable: false, canAddAttributes: false},
            meta: {size: Block.size.statement, type:HTMLBlock.type.block, attributes:[{class:"HTMLAttribute", name:"name", value:"", nameEditable: false}, {class:"HTMLAttribute", name:"content", value:"", nameEditable: false}]},
            title: {size:Block.size.container, type: HTMLBlock.type.inline, draggable: false, canAddAttributes: true, children:[{class:"HTMLText", children:"Title", draggable: false}]},
            body: {size:Block.size.container, type: HTMLBlock.type.block, draggable: false, canAddAttributes: false},
            script: {size: Block.size.container, type: HTMLBlock.type.inline, allowedChildrenTags: null},
            link: {size: Block.size.statement, type: HTMLBlock.type.block, attributes:[{class:HTMLAttribute.name, name:"rel", value:"stylesheet", nameEditable:false, valueEditable:false},{class:HTMLAttribute.name, name:"href", value:"", nameEditable:false}]}
        }
    }
    static get tag(){return "html-block";}
    //#endregion statics
}
customElements.define(HTMLBlock.tag, HTMLBlock);
register(HTMLBlock);
//#endregion HTML Block

//#region HTML Text
class HTMLText extends Block{
    constructor(){
        super();
    }
    static createFromJSON(JSON){//{file, children = "", contentEditable = true, draggable = true, size = Block.size.statement, type = HTMLBlock.type.inline, status = Block.status.placed}){
        //const block = document.createElement("html-text");
        const defaults = {children: "", contentEditable: true, size: Block.size.statement, type: HTMLBlock.type.inline}
        Object.assign(defaults, JSON);
        //Object.assign(block, {file, children, contentEditable, draggable, size, type, status});
        return super.createFromJSON(defaults);
    }
    toJSON(){
        return {
            class: HTMLText.name,
            children: this.children,
            contentEditable: this.contentEditable,
            draggable: this.draggable
        };
    }
    prerender(){return this.children;}
    get children(){return this.textContent;}
    set children(children){this.textContent = children;}

    /*_pasteFeaturesTo(block, opts = {}, newValues = {}){
        const flags = {name: true, type: true, status: true, file: true, draggable: true};
        Object.assign(flags, opts);
        for(const key in flags)
            if(flags[key])
                block[key] = this[key]; 
        for(const key in newValues)
            block[key] = newValues[key];
    }*/

    getMethod(floatingBlock, coord){
        //debugger;
        return HTMLBlock.prototype.getMethod.call(this, floatingBlock, coord);
    }
    //#region __type

    //#endregion __type
    static get tag(){return "html-text";}
}customElements.define(HTMLText.tag, HTMLText);
register(HTMLText);
//#endregion HTML Text

//#region HTML Break
class HTMLBreakElement extends HTMLBlock{
    #breakElement = document.createElement("br");
    constructor(){super();}
    static createFromJSON(JSON){return super.createFromJSON(JSON);}
    toJSON(){return Object.assign(super.toJSON(), {class: HTMLBreakElement.name});}
    globalPointerDrag(event){
        this.#breakElement.remove();
        super.globalPointerDrag(event);
    }
    globalCancel(){
        HTMLElement.prototype.after.call(this, this.#breakElement);
        super.globalCancel();
    }
    connectedCallback(){if(this.status != Block.status.template) HTMLElement.prototype.after.call(this, this.#breakElement);}
    disconnectedCallback(){this.#breakElement.remove();}
    after(block){
        block.file = this.file;
        this.#breakElement.after(block);
    }
    static get tag(){return "html-br";}
}customElements.define(HTMLBreakElement.tag, HTMLBreakElement);
register(HTMLBreakElement);
//#endregion HTML Break


//#region HTML Attribute




class HTMLAttribute extends HTMLElement{
    //#region __construction
    #nameSpan; #valueSpan; #file; #name;#value;
    constructor(){
        super();
    }
    /** @returns {HTMLAttribute}*/
    static createFromJSON({name = undefined, value = undefined, file, nameEditable = true, valueEditable = true, hoverable = true}){
        const attribute = document.createElement(HTMLAttribute.tag);
        attribute.spellcheck = false;
        attribute.append(attribute.nameSpan);
        attribute.append(attribute.valueSpan);
        Object.assign(attribute, {name, value, file, nameEditable, valueEditable, hoverable});
        return attribute;
    }
    toJSON(){
        return {
            class: HTMLAttribute.name,
            name: this.name,
            value: this.value,
            nameEditable: this.nameEditable,
            valueEditable: this.valueEditable
        }
    }
    pathFromParent(){
        return{
            //getter: "attributes",
            //method: "at",
            methods: ["attributes", "at"],
            params: [this.parent.attributes.indexOf(this)]
        };
    }
    //#endregion construction





    prerender(){
        //const semiString = new SemiString(" " + this.nameSpan.textContent);
        //if(this.value !== undefined)
        //    semiString.push("=\"", this.value,"\"")
        //return semiString;
        return " " + this.nameSpan.textContent + (this.value? "=\""+this.valueSpan.textContent +"\"": "");
    }
    
    removeEvents(){

    }
    //#region __getters & setters
        /** @returns {InstanceType<typeof HTMLAttribute.AttrName>}*/
        get nameSpan(){
            if(this.#nameSpan !== undefined)
                return this.#nameSpan;
            if(this.childElementCount == 2)
                return this.#nameSpan = this.childNodes[0];
            return this.#nameSpan = document.createElement(HTMLAttribute.AttrName.tag);
        }
        /**@returns {string} */
        get name(){return this.#name;}
        set name(name){
            if(this.name == "class")
                this.file.classes.decrement(...this.value.split(" "));
            else if(this.name == "id")
                this.file.ids.delete(this.value);
            this.#name = name;
            this.nameSpan.textContent = name ? name : "";
        }
        /**@returns {HTMLFile} */
        get file(){return this.#file;}
        set file(file){
            if(this.file === undefined)
                this.value = this.value;
            return this.#file = file;
        }
        /** @returns {InstanceType<typeof HTMLAttribute.AttrValue>}*/
        get valueSpan(){
            if(this.#valueSpan !== undefined)
                return this.#valueSpan;
            if(this.childElementCount == 2)
                return this.#valueSpan = this.childNodes[1];
            return this.#valueSpan = document.createElement(HTMLAttribute.AttrValue.tag);
        }
        get value(){return this.#value;}
        set value(value){
            if(this.file === undefined);
            else if(this.name == "class")
                this.file.classes.increment(...value.split(" "));
            else if(this.name == "id")
                this.file.ids.add(value);
            else if(this.name == "href"){
                
            }
            this.#value = value;
            if(value !== undefined){
                this.valueSpan.textContent = value;
                this.valueSpan.removeAttribute("style");
            }
            else{
                this.valueSpan.textContent = "";
                this.valueSpan.style.display = "none";
            }
        }
        get nameEditable(){return this.nameSpan.editable;}
        set nameEditable(editable){this.nameSpan.editable = editable;}
        get valueEditable(){return this.valueSpan.editable;}
        set valueEditable(editable){this.valueSpan.editable = editable;}
        /**@returns {IterableIterator<HTMLAttribute>}*/
        get siblingAttributes(){
            return (function*(){
                const attributes = this.parentElement.attributes;
                for(const attribute of attributes)
                    if(attribute !== this)
                        yield attribute;
            }).bind(this);
        }
        get parent(){return this.parentNode.parentNode;}
        set(name, value = undefined){
            //could improve efficiency for setting classes etc
            return Object.assign(this, {name, value});
        }
    //#endregion getters & setters
    calculateBlockPlacement(coord){
        this.parentElement.parentElement.calculateBlockPlacement(coord);
    }
    getPlacedBlock(coord){return this.parentElement.parentElement;}
    getMethod(coord){return "prepend";}
    remove(){
        this.nameSpan
        HTMLElement.prototype.remove.call(this);
    }
    //#region __Sub classes





    //#region ____Super Class: AttrSpan
    static #AttrSpan = class AttrSpan extends HTMLElement{
        #editable
        constructor(){
            super();
        }
        //#region ______getters & setters
        get editable(){return this.#editable;}
        set editable(bool){
            this.#editable = bool;
            if(bool){
                this.contentEditable = "true";
                delete this.globalLeftClick;
            }
            else{
                this.removeAttribute("contentEditable");
                Object.defineProperty(this, "globalLeftClick", {value: undefined, enumerable: false, configurable: true});
            }
        }
        /**@returns {HTMLAttribute} */
        get attribute(){return this.parentElement;}
        get elemName(){return this.attribute.parent.name;}
        /**@returns {AttrName} */
        get attrName(){return this.previousElementSibling;}
        /**@returns {AttrValue} */
        get attrValue(){return this.nextElementSibling;}
        //#endregion getters and setters
        set(){
            /**@type {HTMLAttribute} */
            const attribute = this.parentElement, nameSpan = attribute.nameSpan, valueSpan = attribute.valueSpan;
            const isNewAttr = attribute.name === undefined && attribute.value === undefined;
            const isEmpty = nameSpan.textContent == "";
            if(isNewAttr && isEmpty){
                attribute.remove();
                commandStack.inProgress.clear();
            }
            else if(isNewAttr && !isEmpty){
                const attrPath = new ObjectPath(attribute);
                commandStack.inProgress.undo.object  = () => attrPath.target;
                commandStack.inProgress.undo.methods = ["remove"];
                //commandStack.inProgress.undo.args    =
                const elemPath = new ObjectPath(attribute.parent)
                commandStack.inProgress.redo.object  = () => elemPath.target;
                commandStack.inProgress.redo.methods = ["appendAttribute"];
                const attrJSON = attribute.set(nameSpan.textContent, (valueSpan.style.display === "none" ? undefined : valueSpan.textContent)).toJSON();
                commandStack.inProgress.redo.args    = [() => createFromJSON(attrJSON)];
            }
            else if(!isNewAttr && isEmpty){
                let youngerSib = attribute.nextSibling, method;
                ({method, youngerSib} = youngerSib 
                    ? {method: "before", youngerSib: new ObjectPath(youngerSib)} 
                    : {method: "appendAttribute", youngerSib: new ObjectPath(attribute.parent)});
                commandStack.inProgress.undo.object  = () => youngerSib.target;
                commandStack.inProgress.undo.methods = [method];
                const attrJSON = Object.assign(attribute.toJSON(), {file: attribute.file});
                commandStack.inProgress.undo.args    = [() => createFromJSON(attrJSON)];
                const attrPath = new ObjectPath(attribute);
                commandStack.inProgress.redo.object  = () => attrPath.target;
                commandStack.inProgress.redo.methods = ["remove"];
                //commandStack.inProgress.redo.args    =
                attribute.remove();
            }
            else if(!isNewAttr && !isEmpty){
                if(attribute.name == nameSpan.textContent && attribute.value == valueSpan.textContent)
                    return commandStack.inProgress.clear();
                const attrPath = new ObjectPath(attribute);
                commandStack.inProgress.undo.object  = () => attrPath.target;
                commandStack.inProgress.undo.methods = ["set"];
                commandStack.inProgress.undo.args    = [attribute.name, attribute.value];
                commandStack.inProgress.redo.object  = () => attrPath.target;
                commandStack.inProgress.redo.methods = ["set"];
                attribute.set(nameSpan.textContent, (valueSpan.style.display === "none" ? undefined : valueSpan.textContent))
                commandStack.inProgress.redo.args    = [attribute.name, attribute.value];
            }
            commandStack.inProgress.push();
            this.blur();
        }
        //#region ____event methods
        globalInitialiseDrag(event){
            const block = this.parentElement.parentElement.parentElement;
            if(block.globalInitialiseDrag)
                block.globalInitialiseDrag(event);
        }
        globalCancel(){
            const attribute = this.parentElement;
            //resets values and text content to initial state
            attribute.set(attribute.name, attribute.value);
            this.set();
            this.blur();
        }
        globalLeftClick(event){
            //set event for input here?
            Object.defineProperty(this, "globalLeftClick", {value: undefined, enumerable: false, configurable: true});

        }
        globalInput(event){
            this.filter();
        }
        globalKeyDown(event){
            if(event.key !== "Enter")
                return;
            event.preventDefault();
            //method to grab selection from dropdown list popover?
            this.set();
        }
        blur(){
            delete this.globalLeftClick;
            super.blur();
        }
        static cleanString(string, {regexes, separator = undefined}){
            const INVISIBLE_CHARS = /[\u00A0\u200B\uFEFF]/g;
            string = string.replace(INVISIBLE_CHARS, " ");
            if(regexes == undefined)
                return string;
            if(separator === undefined)
                return regexes.reduce((acc, current) => acc.replace(current, ""), string);
            string = string.split(separator).map(word => regexes.reduce((acc, current) => acc.replace(current, ""), word)).join(separator)
            return string.endsWith(" ") ? string.slice(0, -1) + "\u00A0" : string;
        }
        //#endregion ____event methods
        
        //calculateBlockPlacement(coord){this.parentElement.parentElement.parentElement.calculateBlockPlacement(coord);}
        getPlacedBlock(coord){return this.parentElement.parentElement.parentElement;}
        getMethod(coord){return "prepend";}
        
        
        select(){
            this.globalLeftClick();
            this.focus();
            const range = document.createRange();
            range.selectNodeContents(this);
            range.collapse(true);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
        /**Removes characters from an element without moving caret based on passed rules
         * @param {Object} rules
         * @param {RegExp[]} [rules.regexes]
         * @param {char} [rules.separator]
         * @param {"upper" | "lower"} [rules.case]
         */
        filter(){
            const range = document.createRange();
            const selection = window.getSelection();
            const initialOffset = selection.anchorOffset;
            let leftHalf = this.innerText.slice(0, initialOffset);
            if(this.childNodes.length > 1){ 
                //removes line breaks
                leftHalf = (this.childNodes[0].nodeName == "#text") ? this.childNodes[0].innerHTML : "";
                this.textContent = this.textContent; //quick way to remove <br> and any other inner element
            }
            else if(this.childNodes.length == 0 || this.childNodes[0].nodeName == "BR"){
                this.textContent = "";
                return;
            }
            else if(this.rules.regexes != undefined){
                //leftHalf = this.innerText.slice(0, initialOffset);
                leftHalf = AttrSpan.cleanString(leftHalf, this.rules);
                this.innerText = AttrSpan.cleanString(this.innerText, this.rules);
            }
            this.innerText = this.innerText[this.rules.case == null ? "toString" : (this.rules.case == "upper" ? "toUpperCase" : "toLowerCase")]();
            const newOffset = leftHalf==undefined ? 0 : leftHalf.length;
            range.setStart(this.childNodes[0], newOffset);
            range.collapse(true); 
            selection.removeAllRanges();
            selection.addRange(range);
        }
        
    }
    //#endregion super class
    //#region ____AttrName class
    static AttrName = class AttrName extends HTMLAttribute.#AttrSpan{
        constructor(){
            super();
        }
        set(){
            const name = this.textContent;
            this.blur();
            if(name === "")
                return super.set();
            //const elemName = this.parentElement.parent.name;
            const elemAttrNames = AttrName.byTag[this.elemName]
            if(!(elemAttrNames && elemAttrNames.has(name)) && !AttrName.byTag.global.has(name)){
                this.textContent = "";
                return super.set();
            }
            //const valueSpan = this.parentElement.valueSpan;
            //const ruleGroup = HTMLAttribute.AttrValue.rulesByAttrName[name];
            //const rule = Object.hasOwn(ruleGroup, elemName) ? ruleGroup[elemName] : ruleGroup.generic;
            const isEmptyVal = this.attrValue.rules.type == "empty";
            if(isEmptyVal){
                this.attrValue.style.display = "none";
                return super.set();
            }
            this.attrValue.removeAttribute("style");
            this.attrValue.textContent = "";
            this.attrValue.select();
        }
        get rules(){return {
            regexes: [/(?<!^data)-/gi, /[^a-z-]/gi],
            case: "lower"
        };};
        static byTag = {
            global: new Set(["id", "class","accesskey", "contenteditable", "dir", "draggable", "enterkeyhint", "hidden", "inert", "inputmode", "popover", "spellcheck", "style", "tabindex", "title", "translate"]),
                 a: new Set(["download", "href", "hreflang", "media", "rel", "target", "type"]),
              area: new Set(["alt", "coords", "download", "href", "hreflang", "media", "rel", "shape", "target"]),
             audio: new Set(["autoplay", "controls", "loop", "muted", "preload", "src"]),
              base: new Set(["href", "target"]),
        blockquote: new Set(["cite"]),
            button: new Set(["autofocus", "disabled", "form", "formaction", "name", "popovertarget", "popovertargetaction", "type", "value"]),
            canvas: new Set(["height", "width"]),
               col: new Set(["span"]),
          colgroup: new Set(["span"]),
               del: new Set(["cite", "datetime"]),
           details: new Set(["open"]),
             embed: new Set(["height", "src", "type", "width"]),
          fieldset: new Set(["disabled", "form", "name"]),
              form: new Set(["accept-charset", "action", "autocomplete", "enctype", "method", "name", "novalidate", "rel", "target"]),
            iframe: new Set(["height", "name", "sanbox", "src", "srcdoc", "width"]),
               img: new Set(["alt", "height", "ismap", "src", "srcset", "usemap", "width"]),
             input: new Set(["accept", "alt", "autocomplete", "autofocus", "checked", "dirname", "disabled", "form", "formaction", "height", "list", "max", "maxlength", "mind", "multiple", "name", "pattern", "placeholder", "popovertarget", "popovertargetaction", "readonly", "rel", "size", "src", "step", "type", "value", "width"]),
               ins: new Set(["cite", "datetime"]),
             label: new Set(["for", "form"]),
                li: new Set(["value"]),
              link: new Set(["href", "hreflang", "media", "rel", "type"]),
               map: new Set(["name"]),
              menu: new Set(["type"]),
              meta: new Set(["charset", "content", "http-equiv", "name"]),
             meter: new Set(["form", "high", "low", "max", "mind", "optimum", "value"]),
            object: new Set(["data", "height", "name", "type", "usemap", "width"]),
                ol: new Set(["reversed", "start"]),
          optgroup: new Set(["disabled", "label"]),
            option: new Set(["disabled", "label", "selected", "value"]),
            output: new Set(["for", "form", "name"]),
             param: new Set(["name", "value"]),
          progress: new Set(["max", "value"]),
                 q: new Set(["cite"]),
            script: new Set(["async", "charset", "defer", "src", "type"]),
            select: new Set(["autofocus", "disabled", "form", "multiple", "name", "required", "size"]),
            source: new Set(["media", "src", "srcset", "type"]),
             style: new Set(["media", "type"]),
                td: new Set(["colspan", "headers", "rowspan"]),
          textarea: new Set(["autofocus", "cols", "dirname", "disabled", "form", "maxlength", "name", "placeholder", "readonly", "required", "rows", "wrap"]),
                th: new Set(["colspan", "headers", "rowspan", "scope"]),
              time: new Set(["datetime"]),
             track: new Set(["default", "kind", "label", "src", "srclang"]),
             video: new Set(["autoplay", "controls", "height", "loop", "muted", "poster", "preload", "src", "width"])
        };
        static get tag(){return "attr-name";}
    }
    //#endregion namespan




    //#region ____AttrValue Class
    static AttrValue = class AttrValue extends HTMLAttribute.#AttrSpan{
        constructor(){
            super();
        }
        hide(){
            this.style.display = "none";
            this.textContent = "";
        }
        show(){this.removeAttribute("style");}
        set(){console.log("set");super.set();}
        get rules(){
            const attrName = this.attrName.textContent;
            const rules = AttrValue.rulesByAttrName[attrName];
            const specificRule = rules[this.elemName];
            return specificRule ? specificRule : rules.generic;
        };
        static rulesByAttrName = {
            accept:{generic:{type:"stringlist", list:["audio/*", "video/*", "image/*"], case:"lower", separator: ",", regexes:[/[^a-z/\*]/gi]}}, //also accepts tile extensions, can be multiple
            acceptcharset:{generic:{type:"stringlist", case: "upper", regexes:[/[^a-z\d\-]/gi],list:["UTF-8", "ISO-8859-1"]}}, 
            accesskey:{generic:{type:"string", case:"lower", regexes:inputRegexes.letter}},//restrict to length 1
            //action:{}, redacted currently
            alt:{generic:{type:"string", regexes: []}},
            async:{generic:{type:"empty"}},
            autocomplete:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["on", "off"]}},
            autofocus:{generic:{type:"empty"}},
            autoplay:{generic:{type:"empty"}},
            charset:{generic:{type:"fixed", value:"UTF-8"}},
            checked:{generic:{type:"empty"}},
            cite:{generic:{type:"Ext-URL"}},
            class:{generic:{type:"string", caseSensitive: true, regexes: inputRegexes.identifier, separator:" "}}, //return to class later
            cols:{generic:{type: "string", regexes: inputRegexes.naturals}},
            colspan:{generic:{type: "string", regexes: inputRegexes.naturals}},
            content:{generic:{type:"string"}}, //more complicated
            contenteditable:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["true", "false"]}},
            controls:{generic:{type:"empty"}},
            coords:{generic:{type: "string", regexes: [/[^\d,]/g], separator:","}}, //simplified
            //data-*:{},
            data:{generic:{type:"URL", file:"generic"}}, //generic files are not js and css
            datetime:{},
            default:{generic:{type:"empty"}},
            defer:{generic:{type:"empty"}},
            dir:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["rtl","ltr","auto"]}},
            dirname:{generic:{type:"empty"}},
            disabled:{generic:{type:"empty"}},
            download:{generic:{type:"empty"}},
            draggable:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["true", "false"]}},
            enctype:{generic:{type:"stringlist", case:"lower", regexes:[/ [^a-z/\-]/gi], list:["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]}}, //only used with method="post"
            enterkeyhint:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["done", "enter", "go", "next", "previous", "search", "send"]}},
            for:{},
            form:{},
            formaction:{},
            headers:{},
            height:{generic:{type: "string", regexes: inputRegexes.naturals}},
            hidden:{generic:{type:"empty"}},
            high:{generic:{type: "string", regexes: inputRegexes.reals}}, //simplified
            href:{generic: {type: "URL", regexes: inputRegexes.posix}, link:{type: "Int-URL", file: "css", regexes: inputRegexes.posix}},
            hreflang:{generic:{type:"language", list:[]}},
            httpequiv:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.lettersHyphenated, list:["content-security-policy", "content-type", "default-style", "refresh"]}},
            id:{generic:{type: "string", caseSensitive: true, regexes:inputRegexes.identifier}}, //return to ID later?
            inert:{generic:{type:"empty"}},
            inputmode:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["none", "text", "decimal", "numeric", "tel", "search", "email", "url"]}},
            ismap:{generic:{type:"empty"}},
            kind:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["subtitles", "captions", "chapters", "metadata"]}},
            label:{generic:{type:"string", regexes: []}},
            list:{},
            loop:{generic:{type:"empty"}},
            low:{generic:{type: "string", regexes: inputRegexes.reals}},
            max:{generic:{type: "string", regexes: inputRegexes.reals}},//if<input type="date"> is date
            maxlength:{generic:{type: "string", regexes: inputRegexes.naturals}}, 
            media:{}, //complicated
            method:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["get","post"]}},
            min:{generic:{type: "string", regexes: inputRegexes.reals}},
            multiple:{generic:{type:"empty"}},
            muted:{generic:{type:"empty"}},
            name:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.lettersHyphenated, list:["application-name", "author", "description", "generator", "keywords", "referrer", "theme-color", "color-scheme", "viewport"]}},
            novalidate:{generic:{type:"empty"}},
            open:{generic:{type:"empty"}},
            optimum:{generic:{type: "string", regexes: inputRegexes.reals}},
            //pattern:{generic:{type:"regex"}}, //very complicated
            placeholder:{generic:{type:"string"}},
            popover:{generic:{type:"empty"}},
            popovertarget:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["show", "hide", "toggle"]}},
            popovertargetaction:{},
            poster:{generic:{type: "URL", file:"image"}},
            preload:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["none", "metadata","auto"]}},
            readonly:{generic:{type:"empty"}},
            rel:{a:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["alternate", "author", "bookmark", "external", "help", "license", "next", "nofollow", "noopener", "noreferrer", "prev", "search", "tag"]},
                area:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["alternate", "author", "bookmark", "help", "license", "next", "nofollow", "noreferrer", "prefetch", "prev", "search", "tag"]},
                link:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["alternate", "author", "dns-prefetch", "help", "icon", "license", "next", "pingback", "preconnect", "prefetch", "prerender", "prev", "search", "stylesheet"]},
                form:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["external", "help", "license", "next", "nofollow", "noopener", "noreferrer", "opener", "prev", "search"]}},
            required:{generic:{type:"empty"}},
            reversed:{generic:{type:"empty"}},
            rows:{generic:{type: "string", regexes: inputRegexes.naturals}},
            rowspan:{generic:{type: "string", regexes: inputRegexes.naturals}},
            sandbox:{generic:{type:"empty"}},
            scope:{generic:{type:"stringlist", list:["col", "row", "colgroup", "rowgroup"], case:"lower", regexes:inputRegexes.letters}},
            selected:{generic:{type:"empty"}},
            shape:{generic:{type:"stringlist", list:["default", "rect", "circle", "poly"], case:"lower", regexes:inputRegexes.letters}},
            size:{generic:{type: "string", regexes: inputRegexes.naturals}},
            span:{generic:{type: "string", regexes: inputRegexes.naturals}},
            spellcheck:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["true", "false"]}},
            src:{audio:{type:"URL", file:"audio"}, embed:{type:"URL", file:"generic"}, iframe:{type:"URL", file:"html"}, img:{type:"URL", file:"image"}, input:{type:"URL", file:"image"},script:{type: "Int-URL", file: "js"}, source:{type:"URL", file:"media"}, track:{type:"URL", file:"vtt"}, video:{type:"URL", file:"video"}},
            srcdoc:{},
            srclang:{generic:{type:"language"}},
            srcset:{generic:{type: "URL", file:"image"}},
            start:{generic:{type: "string", regexes: inputRegexes.integers}},
            step:{generic:{type: "string", regexes: inputRegexes.integers}},
            //style:{},
            tabindex:{generic:{type: "string", regexes: inputRegexes.integers}},
            target:{generic:{type:"stringlist", case: "lower", regexes:[/[^a-z]/gi, /(?!^)_/g], list:["_blank","_self", "_parent", "_top", "framename"]}},
            title:{generic:{type:"string", regexes: []}},
            translate:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["no", "yes"]}},
            type:{generic:{type:"media_type"},
                button:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["button", "submit", "reset"]},
                input:{type:"stringlist", case:"lower", regexes:inputRegexes.lettersHyphenated, list:["button", "checkbox", "color", "date", "datatime-local", "email", "file", "hidden", "image", "month", "number", "password", "radio", "range", "reset", "search", "tel", "text", "time", "url", "week"]},
                menu:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["list", "context", "toolbar"]},
                script:{type:"fixed", vale:""}},// scripttype
            usemap:{},
            value:{button:{type:"string", regexes: []}, input:{type:"string", regexes: []}, option:{type:"string", regexes: []}, li:{type:"string", regexes: inputRegexes.integers}, meter:{type:"string", regexes: inputRegexes.reals}, progress:{type:"string", regexes: inputRegexes.reals}, param:{type:"string", regexes:[]}}, //more research about the numbers
            width:{generic:{type: "string", regexes: inputRegexes.naturals}},
            wrap:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["soft", "hard"]}},
        };
        static get tag(){return "attr-value";}
    }
    //#endregion valuespan
    //#endregion __nested classes
    /*static stringListELement = document.createElement(CustomPopover.tag);
    static {
        this.stringListELement.attachShadow({mode: 'open'})
        this.stringListELement.shadowRoot.innerHTML = `<ul><slot></slot></ul>`;
    };*/
    static get tag(){return "html-attr";}
}customElements.define(HTMLAttribute.tag, HTMLAttribute);
customElements.define(HTMLAttribute.AttrName.tag, HTMLAttribute.AttrName);
customElements.define(HTMLAttribute.AttrValue.tag, HTMLAttribute.AttrValue);
register(HTMLAttribute);



class CustomPopover extends HTMLElement{
    constructor(){
        super();
    }
    get resizable(){return this.classList.has("resizable");}
    set resizable(bool){this.classList[bool ? "add" : "remove"]("resizable");}
    /** @param {HTMLElement} callingElement  */
    showUnder(callingElement){
        if(!callingElement.isConnected)
            throw new Error(`Element ${callingElement} is not connected to DOM`)
        this.callingElement = callingElement;
        const callingRect = callingElement.getBoundingClientRect();
        let ancestor = callingElement;
        while (ancestor && window.getComputedStyle(ancestor).position === 'static') 
            ancestor = ancestor.parentElement;
        const ancestorRect = ancestor ? ancestor.getBoundingClientRect() : {top: 0, left: 0};
        Object.assign(this.style, {top: callingRect.bottom - ancestorRect.top+ "px",left: callingRect.left - ancestorRect.left + "px",});
        callingElement.after(this);
        newListeningObjects.set("globalLeftClick", this);
    }
    remove(){
        delete this.callingElement;
        HTMLElement.prototype.remove.call(this);
        newListeningObjects.delete("globalLeftClick", this);
        return false;
    }
    globalPointerDown(event){
        event.preventDefault();
        const rect = this.getBoundingClientRect();
        this.offset = new Coord(rect.right - event.clientX, rect.bottom - event.clientY);
    }
    globalLeftClick(event){
        if(!this.callingElement.contains(event.target) && !this.contains(event.target))
            return this.remove();
    }
    globalInitialiseDrag(event){this.dragging = this.offset.isIn({left: 0, right: 16, top: 0, bottom: 16});}
    globalPointerDrag(event){
        const rect = this.getBoundingClientRect();
        Object.assign(this.style, {
            width:event.clientX + this.offset.x - rect.left+"px", 
            height:event.clientY + this.offset.y - rect.top+"px"
        });
    }
    set dragging(bool){
        if(bool){
            delete this.globalPointerDrag;
            Object.defineProperty(this, "globalInitialiseDrag", {value: undefined,enumerable: false,configurable: true});
        }else{
            Object.defineProperty(this, "globalPointerDrag", {value: undefined,enumerable: false,configurable: true});
            delete this.globalInitialiseDrag;
        }
    }
    globalPointerDragEnd(event){this.dragging = false;}

    static get tag(){return "pop-over";}
}customElements.define(CustomPopover.tag, CustomPopover)

//#endregion HTML Attribute
//#endregion **HTML**





//#region *******CSS*******

//#endregion **CSS**





//#region ********JS********

//#endregion **JS**



//#region ********UI********





//#region Buttons
const home = document.getElementById("home");
home.globalLeftClick = () => {
    //console.log("home pressed")
    //debugger;
    const file = Folder.ROOT.children.get("html", "index");
    navbar.textContent = "/index.html";
    iframe.render(file);
};
const refresh = document.getElementById("refresh");
refresh.globalLeftClick = () => {iframe.render(iframe.renderedFile);};

const navbar = document.getElementById("navbar");

const folder = document.getElementById("folder");
/**@type {CustomPopover} */
const directoryPopover = document.createElement(CustomPopover.tag);
directoryPopover.id = "directoryPopover";
directoryPopover.resizable = true;
directoryPopover.file = Folder.ROOT;
const showUnder = directoryPopover.showUnder;
directoryPopover.showUnder = (...args) => {
    showUnder.call(directoryPopover, ...args);
    folder.textContent = "📂";
}
const remove = directoryPopover.remove;
directoryPopover.remove = () => {
    remove.call(directoryPopover);
    folder.textContent = "📁";
}


//directoryPopover.attachShadow({mode: 'open'})
//directoryPopover.shadowRoot.innerHTML = `<ul><slot></slot></ul>`;
folder.globalLeftClick = () => {
    directoryPopover.replaceChildren();
    folderClicked.call(directoryPopover);
    const button = document.createElement("button");
    button.title = "Add new file or folder";
    button.append("+");
    button.globalLeftClick = ()=>{newFileGUI()};
    directoryPopover.prepend(button);
    directoryPopover.showUnder(folder);
};
function folderClicked(){
    const folder = this.file;
    let list = this.querySelector("ul");
    this.classList[this.classList.contains("closed") ? "remove" : "add"]("closed");
    if(list)
        return ;
    list = document.createElement("ul");
    for(const file of folder.children.values()){
        const item = document.createElement("li");
        item.file = file;
        item.title = file.name
        const name = document.createElement("span");
        name.classList.add("name");
        
        item.appendChild(name);
        if(file instanceof Folder){
            //item.append(file.name);
            const button = document.createElement("button");
            button.title = "Add new file or folder to " + file.name;
            button.append("+");
            button.classList.add("new")
            button.globalLeftClick = ()=>{newFileGUI(file)};
            name.prepend(button);
            item.classList.add("folder", "closed");
            item.globalLeftClick = folderClicked;
        }else{
            
            const type = document.createElement("span");
            type.classList.add("type");
            type.append("."+file.type);
            type.globalLeftClick = (event) => item.globalLeftClick(event);
            item.appendChild(type)
            item.classList.add("file");
            item.title += "."+file.type;
            item.globalLeftClick = () => tabs.addFile(file);
        }
        name.globalLeftClick = (event) => item.globalLeftClick(event);
        const edit = document.createElement("button");
        edit.title = "edit name of " + file.name + (file.type? "."+file.type:"");
        edit.textContent = "✎";
        edit.classList.add("edit");
        edit.globalLeftClick = () => editNameGUI(file);
        name.append(edit);
        name.append(file.name);
        list.appendChild(item);
    }
    //const buttonItem = document.createElement("li");
    //buttonItem.classList.add("button");
    
    
    //buttonItem.append(button);
   
    //list.appendChild(buttonItem);
    this.appendChild(list);
};
function newFileGUI(folder = Folder.ROOT){
    //const parent = this.parentElement
    let fileName = prompt("enter file name and extension");
    while(fileName){
        try{
            const split = fileName.split(".");
            const name = split[0];
            const type = split.length==1 ? "" : split[1];
            /**@type {new} */
            let classRef;
            switch(type){
                case "":
                    classRef = Folder;
                    break;
                case "html":
                    classRef = HTMLFile;
                    break;
                //case "css":
                //    break;
                //case "js":
                //    break;
                default:
                    //file = new File({parent: folder, name: split[0], type: split[1]})
                    throw new Error("invalid file extension");
            }
            const file = new classRef({parent: folder,name:split[0]})
            const filePath = new ObjectPath(file);
            commandStack.inProgress.undo.object  = () => filePath.target;
            commandStack.inProgress.undo.methods = ["delete"];
            commandStack.inProgress.undo.args    = [];
            commandStack.inProgress.redo.object  = Reflect;
            commandStack.inProgress.redo.methods = ["construct"];
            const folderPath = new ObjectPath(folder);
            commandStack.inProgress.redo.args    = [classRef, () =>([{parent: folderPath.target, name:name}])];
            commandStack.inProgress.push();
            break;
        }catch(error){
            fileName = prompt(error.message + "\nenter file name and extension");
        }
    }
    
}
/**@param {Entry} file */
function editNameGUI(file){
    let fileName = prompt("Enter a new name for "+(file instanceof Folder? "folder":"file")+ " "+file.name);
    const oldName = file.name;
    const oldFilePath = new ObjectPath(file);
    while(fileName){
        try{
            file.name = fileName;
            const newFilePath = new ObjectPath(file);
            commandStack.inProgress.undo.object  = () => newFilePath.target;
            commandStack.inProgress.undo.methods = [{method:"name", type:"setter"}];
            commandStack.inProgress.undo.args    = [oldName];
            commandStack.inProgress.redo.object  = () => oldFilePath.target;
            commandStack.inProgress.redo.methods = [{method:"name", type:"setter"}];
            commandStack.inProgress.redo.args    = [fileName];
            commandStack.inProgress.push();
            break;
        }catch(error){
            fileName = prompt(error.message +"\nEnter a new name for "+(file instanceof Folder? "folder":"file")+ " "+file.name);
        }
    }
    
}
function scanHTML(htmlString){

}
//#endregion buttons


const editor = document.getElementById("editor");


//#region iframe
const iframe = document.getElementById("renderer");
iframe.write = function(data){
    this.contentDocument.open();
    this.contentDocument.write(data);
    this.contentDocument.close();
}
iframe.render = function(file){
    if(!file){return false;}
    const render = file.render();
    console.log(render);
    iframe.write(render);
    iframe.renderedFile = file;
    return true;
}

const iframeAnchorScript =
     '<script>'
        +'document.addEventListener("click", (event) => {'
            +'const anchor = event.target.closest("a");'
            //+'console.log("iframe clicked", anchor);'
            +'if (!anchor) return;'
            +'event.preventDefault();'
            +'window.parent.postMessage({ type: "linkClick", href: anchor.getAttribute("href") }, "*");'
        +'});'
    +'</script>'
;
window.addEventListener("message", (event) => {
    console.log(event.data);
    if(event.data.type == "linkClick"){
        const file = ObjectPath.locateFromString(event.data.href, iframe.renderedFile);
        if(iframe.render(file))
            navbar.textContent = event.data.href;
    }
});
//#endregion iframe





//#region Tabs 





    //#region __tabs element 
    const tabs = (function(){
        const element = document.getElementById("tabs");
        element.childNodes.forEach(node => {
            if(node.nodeName == "#text")
                node.remove();
        });
        element.files = new WeakMap();
        let focus;
        element.populateFromJSON = function(JSON){
            JSON.tabs.forEach(objectpath => element.addFile(ObjectPath.locateFromJSON(objectpath.path)));
            element.setFocus(element.childNodes[JSON.focusIndex]);
        };
        element.toJSON = function(){
            const childrenArray = Array.from(element.children);
            return{
                object: "tabs", 
                tabs: childrenArray.map(tab => new ObjectPath(tab.file)),
                focusIndex: childrenArray.indexOf(focus)
            };
        };
        element.addFile = function(file){
            if(element.files.has(file))
                return;
            const tab = Tab.create(file);
            element.files.set(file, tab);
            element.appendChild(tab);
        };
        element.removeFile = function(file){
            if(!element.files.has(file))
                return;//throw new Error(`File ${file} is not a tab in the tabs section`);
            element.removeTab(element.files.get(file));
            //hide that file from display
            //load neighbouring tab
            //remove tab
        };
        element.removeTab = function(tab){
            if(tab === focus)
                focus = undefined;
            element.files.delete(tab.file)
            tab.file.unload();
            tab.remove();
        };
        element.setFocus = function(tab){
            if(tab instanceof File)
                tab = element.files.get(tab);
            if(tab === focus)
                return;
            if(focus !== undefined){
                focus.classList.remove("tabs-focus");
                editor.replaceChildren();
            }
            focus = tab;
            focus.classList.add("tabs-focus");
            focus.file.display();
        };
        const placeholder = document.createElement("div");
        element._initialiseDrag = function(event){
            //get dimensions of clicked tab
            //set placeholder dimensions to match
            
            element.dragging(true);
            tabs.setPointerCapture(event.pointerId);
        };
        element._pointerDrag = function(event){
            
        };
        element._pointerCancel = function(event){

            element.dragging(false);
        };
        element._dragEnd = function(event){

            element.dragging(false);
        };
        element.dragging = function(bool){
            tabs.globalPointerDrag = bool? element._pointerDrag : undefined;
            tabs.globalPointerCancel = bool? element._pointerCancel : undefined;
            tabs.globalDragEnd = bool? element._dragEnd : undefined;
        };
        return element;
    })();
    //#endregion tabs element





    //#region __Tab class
    class Tab extends HTMLElement{
        #nameElement= document.createElement("span"); #typeElement = document.createElement("span");
        constructor(){
            super();
            //this.#nameElement = document.createElement("span");
            this.nameElement.classList.add("file-name");
            this.nameElement.parent = this;
            this.nameElement.globalLeftClick = this.childrenLeftClickEvent;
            this.nameElement.globalInitialiseDrag = this.childrenInitialiseDrag;
            this.nameElement.globalMiddleClick = this.globalMiddleClick.bind(this);
            
            //this.#typeElement = document.createElement("span");
            this.typeElement.classList.add("file-type");
            this.typeElement.parent = this;
            this.typeElement.globalLeftClick = this.childrenLeftClickEvent;
            this.typeElement.globalInitialiseDrag = this.childrenInitialiseDrag;
            this.typeElement.globalMiddleClick = this.globalMiddleClick.bind(this);
        }
        get nameElement(){return this.#nameElement;}
        get typeElement(){return this.#typeElement;}
        static create(file){
            const tab = document.createElement("file-tab");
            tab._file = file;

            tab.nameElement.textContent = file.name;
            tab.appendChild(tab.nameElement);
            
            tab.append(".");

            tab.typeElement.textContent = file.type;
            tab.appendChild(tab.typeElement);
            
            file.load();

            return tab;
        }
        get file(){return this._file;}
        childrenLeftClickEvent(event){
            this.parent.setPointerCapture(event.pointerId);
            this.parent.globalLeftClick(event);
        }
        childrenInitialiseDrag(event){
            this.parent.setPointerCapture(event.pointerId);
            tabs.globalIinitialiseDrag(event);
        }
        globalLeftClick(event){
            tabs.setFocus(this);
        }
        globalMiddleClick(event){
            //add close tab to the command stack
        }
        globalInitialiseDrag(event){
            tabs.globalInitialiseDrag(event);
        }
    }
    customElements.define("file-tab", Tab);
    register(Tab);
    //#endregion tab class
//#endregion tabs
//#endregion UI




//#region Default JSONs
const defaultJSON = {
    files:[{
        class:HTMLFile.name, name:"index", type: "html", children:[
            {class:HTMLBlock.name, name:"!DOCTYPE", canAfter: false, canPrepend: false},
            {class:HTMLBlock.name, name: "html", canAfter: false, canPrepend: false, children:[
                {class:HTMLBlock.name, name:"head", canAfter: false, children:[
                    {class:HTMLBlock.name, name:"meta", attributes:[{class:"HTMLAttribute", name:"charset", value:"UTF-8", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class:HTMLBlock.name, name:"meta", attributes:[{class:"HTMLAttribute", name:"name", value:"viewport", nameEditable: false, valueEditable: false}, {class:"HTMLAttribute", name:"content", value:"width=device-width, initial-scale=1.0", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class:HTMLBlock.name, name:"title"}
                    ]
                },
                {class:HTMLBlock.name, name:"body", canAfter: false}
            ]}
        ]
    }],
    settings:[
        {object:"tabs", focusIndex: 0, tabs:[
            {class: ObjectPath.name, path:[{/*getter:"children", method:"get",*/methods: ["children", "get"], params:["html", "index"]}]}
            ]
        }
    ]
};
const defaultHTMLTemplatePanel = [
    {id:"Text", children:["text", "h1","h2","h3","h4","h5","h6","p","a","br","hr","b","del","em","i","mark","q","s","small","sub","sup","u"]},
    {id:"Formatting", children:[]},
    {id: "Layout", children:["header","main","footer","article","aside","details","dialog","section","search","summary"]},
    {id:"Forms", children:["form","input","textarea","button","select","optgroup","option","label","fieldset","legend","datalist","output"]},
    {id:"Media", children:["img", "figure","figcaption","map","picture","audio","video","source",]}, 
    {id:"lists", children:["ul","ol","li","dl","dt","dd"]},
    {id:"Tables", children:["table","caption","th","tr","td","thead","tbody","tfoot","colgroup","col",]},
    {id:"Programming", children:["script", "link"]}
];
//#endregion default JSONs

//#region ***Server Interactions***
load = function(){
    for(const file of defaultJSON.files){
        //Folder.ROOT;
        createFromJSON(Object.assign(file, {parent: Folder.ROOT}));
    }
    for(const setting of defaultJSON.settings){
        populateFromJSON(setting);
    }
    HTMLFile.populateTemplatePanel(defaultHTMLTemplatePanel);
}
load();
save = function(){

}
//#endregion server interactions