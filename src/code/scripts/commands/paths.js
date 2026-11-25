import { register, callByPath, isString } from "../utils";
import { Folder } from "../filesystem";

export class ObjectPath extends Array{
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
    static key = "ObjectPath";
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
            throw new Error(`${ObjectPath.key} is locked`);
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
            console.error(`${ObjectPath.key} is not locked: ${this}`);
        if(this.type === ObjectPath.types.absolute)
            relative = Folder.ROOT;
        let currentEntry = relative;
        for(const identifier of this)
            currentEntry = callByPath(currentEntry, identifier.methods, ...identifier.params);
        return currentEntry
    }
    toJSON(){
        return {
            class: ObjectPath.key,
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

export class RelativePath extends Array{
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