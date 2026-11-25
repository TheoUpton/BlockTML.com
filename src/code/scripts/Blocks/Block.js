import { Coord } from "../structures/Coord";
import { File } from "../filesystem/entries";
import { commandStack } from "../commands/CommandStack";
import { register, isJSONObject, createFromJSON, isFunction, isString } from "../utils";
import { ObjectPath } from "../commands/paths";
import { BLOCK } from "./constants";
import { HTMLBLOCK } from "./HTMLBlock/constants";

export class Block extends HTMLElement{
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
    static name = BLOCK.name;
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
        const defaults = {status: BLOCK.status.placed, draggable: true, canAfter: true, canPrepend:true, children: []};
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
            class: BLOCK.name,
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


    get folded(){return this._internals.states.has("--"+"folded")}
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
        const part = event.composedPath()[0].getAttribute("part")
        if(part !=null && (part !="top" && part !="left" && part !="bottom"))
            return;
        const isPlaced = this.isStatus(BLOCK.status.placed);
        //initialise in progress command for moving placed blocks 
        if(!isPlaced)
            commandStack.inProgress.undo.methods = ["remove"];
        //setup cloning block
        
        const rect = this.getBoundingClientRect();
        const block = isPlaced ? this : this.cloneBlock({name:true, type: true});
        Object.assign(block.style, {left: rect.left +"px", top: rect.top+"px"});
        block.status = BLOCK.status.floating;
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
        placedBlock = placedBlock.status !== BLOCK.status.template ? placedBlock : undefined;


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
        if(placedBlock.size === BLOCK.size.statement)
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
            const floatingJSON = Object.assign(floatingBlock.toJSON(), {status: BLOCK.status.placed});
            commandStack.inProgress.redo.args = [() => createFromJSON(floatingJSON)];


            placedBlock[method](floatingBlock);
            floatingBlock.status = BLOCK.status.placed;


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
            floatingBlock.status = BLOCK.status.placed;
            const olderSiblingPath = new ObjectPath(olderSibling);
            commandStack.inProgress.undo.object = () => olderSiblingPath.target;


            const preFloatPath = new ObjectPath(floatingBlock);
            commandStack.inProgress.undo.args = [() => preFloatPath.target];
            
            this.file.clearPrerender();
        }else if (!blockAdded && !isFromTemplate){
            let olderSibling = floatingBlock.previousElementSibling;
            commandStack.inProgress.undo.object  = olderSibling ? olderSibling : floatingBlock.parent;
            commandStack.inProgress.undo.methods = olderSibling ? ["after"] : ["prepend"];
            const floatingJSON = Object.assign(floatingBlock.toJSON(), {status: BLOCK.status.placed});
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
        floatingBlock.status = BLOCK.status.placed;
        floatingBlock.#dragging(false);
    }
    //#endregion pointer handling




    //#region size, type & status





        //#region __size
    get validSizes(){return Object.values(BLOCK.size)}
    isValidSize(query){return this.validSizes.includes(query)}
    /**@returns {Block.size} */
    get size(){
        const sizesSet = [];
        this.validSizes.forEach(value => {
            if(this._internals.states.has("--"+value))
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
        this.validSizes.forEach(size => this._internals.states.delete("--"+size));
        this._internals.states.add("--"+newSize);
    }
        //#endregion __size


        //#region __type
    get validTypes(){
        if(this.constructor.type)
            return Object.values(this.constructor.type);
        return Object.values(HTMLBLOCK.type);
    }
    isValidType(queryType){return this.validTypes.includes(queryType);}
    //** @returns {(this.constructor).type} */
    get type(){
        const types = this.validTypes.filter(type => this._internals.states.has("--"+type));
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
        this.validTypes.forEach(type => this._internals.states.delete("--"+type));
        this._internals.states.add("--"+newType);
    }
        //#endregion __type


        //#region __status
    get validStati(){return Object.values(BLOCK.status)}
    isValidStatus(query){return this.validStati.includes(query)}
    /**@returns {Block.status} */
    get status(){
        const stati = this.validStati.filter(status => this._internals.states.has("--"+status));
        if(stati.length > 1)
            throw new Error("Block has multiple statuses: ", stati, "\n", this);
        if(stati.length == 0)
            return;
        return stati[0];
    }
    set status(status){
        if(!this.isValidStatus(status)){debugger;
            throw new Error(`Status ${status} not valid for ${this.name}.\nValid types are: ${this.validStati}`)}
        this.validStati.forEach(status => this._internals.states.delete("--"+status));
        this._internals.states.add("--"+status);
        if(status === BLOCK.status.placed)
            this.removeAttribute("style");
    }
    isStatus(query){return this._internals.states.has("--"+query)}
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
        const clone = block.cloneBlock({type:true}, {status: BLOCK.status.placeholder});
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
customElements.define(BLOCK.tag, Block);
register(Block);