import { register, isString, createFromJSON, SemiString } from "./utils";
import { NestedMap } from "./structures/NestedMap";
import { tabs } from "./DOM";
//TODO extract Entry, File, Folder into 3 separate files and decouple Folder.ROOT
//#region Entry



export class Entry{
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



export class File extends Entry{
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
export class Folder extends Entry{
    
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