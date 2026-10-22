//#region ******Global******



import {register, createFromJSON, populateFromJSON, isString} from "./utils";
import { SemiString } from "./structures/SemiString";
import { CountMap } from "./structures/CountMap";
import { commandStack } from "./commands/CommandStack";
import { ObjectPath } from "./commands/paths";
import { bindEvents } from "./event-handling/bindEvents";
import { File, Folder } from "./entries";
import { BLOCK, HTMLBLOCK, ATTRIBUTE, NAME, VALUE, BREAK, TEXT } from "./constants"
import { Block } from "./Block";
import { iframeAnchorScript } from "./DOM/iframe";
import "./DOM/elements";

bindEvents();
//#region Objects

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








//#endregion Global





//#region *******Files*******











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
            /**@returns {BLOCK.status} */
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
customElements.define(BLOCK.tag, Block);
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
                createFromJSON(Object.assign({class:HTMLBLOCK.name, name:child, status:BLOCK.status.template}, HTMLBlock.propertiesByName[child]))
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
            class: HTMLBLOCK.name,
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
        this.addAttributesEvents(bool && this.status === BLOCK.status.placed);
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
        if(this.size !== BLOCK.size.statement)
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
        if(placedBlock.type === HTMLBLOCK.type.inline && floatingBlock.type === HTMLBLOCK.type.block)
            return "remove";
        if(placedBlock.type === HTMLBLOCK.type.phrasingonly && floatingBlock.type !== HTMLBLOCK.type.inline)
            return "remove";
        return "prepend";
    }
    //#endregion event methods





    //#region __type & status
        get type(){
            const type = super.type;
            if(type !== HTMLBLOCK.type.transparent)
                return type;
            //if transparent has block children then it is block
            return this.children.some(child => child.type === HTMLBLOCK.type.block) 
                ? HTMLBLOCK.type.block
                : HTMLBLOCK.type.inline;
        }
        set type(newType){super.type = newType;}

        get status(){return super.status;}
        set status(newStatus){
            super.status = newStatus;
            this.addAttributesEvents(newStatus === BLOCK.status.placed && this.canAddAttributes && !this.folded);
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
            text: {class: TEXT.name, children: "Text"},
            h1: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            h2: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            h3: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            h4: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            h5: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            h6: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            p: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly, invalidTypes: []},
            a: {size: BLOCK.size.container, type: HTMLBLOCK.type.transparent, attributes:[{class:ATTRIBUTE.name, name:"href", value:"", nameEditable:false}]},
            br: {class: BREAK.name, size: BLOCK.size.statement, type: HTMLBLOCK.type.inline},
            hr: {size: BLOCK.size.statement, type: HTMLBLOCK.type.block},
            b: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            del: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            em: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            i: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            mark: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            q: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            s: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            small: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            sub: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            sup: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            u: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
        //Formatting
        //Layout
            header: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            main: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            footer: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            article: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            aside: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            details: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            dialog: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            section: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            search: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            summary: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly},
        //Forms
            form: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            input: {type: HTMLBLOCK.type.inline, attributes:[{class:ATTRIBUTE.name, name:"type", value:"", nameEditable: false}]},
            textarea: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            button: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            select: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            optgroup: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            option: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            label: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            fieldset: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            legend: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly},
            datalist: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            output: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
        //Media
            img: {size: BLOCK.size.statement, type: HTMLBLOCK.type.inline, attributes:[{class:ATTRIBUTE.name, name:"src", value:"", nameEditable:false}, {class:ATTRIBUTE.name, name:"alt", value:"", nameEditable:false}]},
            figure: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            figcaption: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly},
            map: {size: BLOCK.size.container, type: HTMLBLOCK.type.transparent},
            picture: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            audio: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            video: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            source: {size: BLOCK.size.statement, type: HTMLBLOCK.type.block},
        //lists
            ul: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            ol: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            li: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            dl: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            dt: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly},
            dd: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly},
        //Tables
            table: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            caption: {size: BLOCK.size.container, type: HTMLBLOCK.type.phrasingonly},
            th: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            tr: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            td: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline},
            thead: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            tbody: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            tfoot: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            colgroup: {size: BLOCK.size.container, type: HTMLBLOCK.type.block},
            col: {size: BLOCK.size.statement, type: HTMLBLOCK.type.block},
        //Meta
            "!DOCTYPE": {size: BLOCK.size.statement, type:HTMLBLOCK.type.block, attributes:[{class: ATTRIBUTE.name, name:"html", nameEditable: false, valueEditable: false}], draggable: false, canAddAttributes: false},
            html: {size:BLOCK.size.container, type: HTMLBLOCK.type.block, attributes: [{class:ATTRIBUTE.name, name: "lang", value:"en", nameEditable: false}], draggable: false, canAddAttributes: false},
            head: {size:BLOCK.size.container, type: HTMLBLOCK.type.block, draggable: false, canAddAttributes: false},
            meta: {size: BLOCK.size.statement, type:HTMLBLOCK.type.block, attributes:[{class:ATTRIBUTE.name, name:"name", value:"", nameEditable: false}, {class:ATTRIBUTE.name, name:"content", value:"", nameEditable: false}]},
            title: {size:BLOCK.size.container, type: HTMLBLOCK.type.inline, draggable: false, canAddAttributes: true, children:[{class:TEXT.name, children:"Title", draggable: false}]},
            body: {size:BLOCK.size.container, type: HTMLBLOCK.type.block, draggable: false, canAddAttributes: false},
            script: {size: BLOCK.size.container, type: HTMLBLOCK.type.inline, allowedChildrenTags: null},
            link: {size: BLOCK.size.statement, type: HTMLBLOCK.type.block, attributes:[{class:ATTRIBUTE.name, name:"rel", value:"stylesheet", nameEditable:false, valueEditable:false},{class:ATTRIBUTE.name, name:"href", value:"", nameEditable:false}]}
        }
    }
    static get tag(){return "html-block";}
    //#endregion statics
}
customElements.define(HTMLBLOCK.tag, HTMLBlock);
register(HTMLBlock);
//#endregion HTML Block

//#region HTML Text
class HTMLText extends Block{
    constructor(){
        super();
    }
    static createFromJSON(JSON){//{file, children = "", contentEditable = true, draggable = true, size = Block.size.statement, type = HTMLBlock.type.inline, status = Block.status.placed}){
        //const block = document.createElement("html-text");
        const defaults = {children: "", contentEditable: true, size: BLOCK.size.statement, type: HTMLBLOCK.type.inline}
        Object.assign(defaults, JSON);
        //Object.assign(block, {file, children, contentEditable, draggable, size, type, status});
        return super.createFromJSON(defaults);
    }
    toJSON(){
        return {
            class: TEXT.name,
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
}customElements.define(TEXT.tag, HTMLText);
register(HTMLText);
//#endregion HTML Text

//#region HTML Break
class HTMLBreakElement extends HTMLBlock{
    #breakElement = document.createElement("br");
    constructor(){super();}
    static createFromJSON(JSON){return super.createFromJSON(JSON);}
    toJSON(){return Object.assign(super.toJSON(), {class: BREAK.name});}
    globalPointerDrag(event){
        this.#breakElement.remove();
        super.globalPointerDrag(event);
    }
    globalCancel(){
        HTMLElement.prototype.after.call(this, this.#breakElement);
        super.globalCancel();
    }
    connectedCallback(){if(this.status != BLOCK.status.template) HTMLElement.prototype.after.call(this, this.#breakElement);}
    disconnectedCallback(){this.#breakElement.remove();}
    after(block){
        block.file = this.file;
        this.#breakElement.after(block);
    }
    static get tag(){return "html-br";}
}customElements.define(BREAK.tag, HTMLBreakElement);
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
        const attribute = document.createElement(ATTRIBUTE.tag);
        attribute.spellcheck = false;
        attribute.append(attribute.nameSpan);
        attribute.append(attribute.valueSpan);
        Object.assign(attribute, {name, value, file, nameEditable, valueEditable, hoverable});
        return attribute;
    }
    toJSON(){
        return {
            class: ATTRIBUTE.name,
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
            return this.#nameSpan = document.createElement(NAME.tag);
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
            return this.#valueSpan = document.createElement(VALUE.tag);
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
}customElements.define(ATTRIBUTE.tag, HTMLAttribute);
customElements.define(NAME.tag, HTMLAttribute.AttrName);
customElements.define(VALUE.tag, HTMLAttribute.AttrValue);
register(HTMLAttribute);

//#endregion HTML Attribute
//#endregion **HTML**





//#region *******CSS*******

//#endregion **CSS**





//#region ********JS********

//#endregion **JS**



//#region ********UI********





//#region iframe









//#endregion iframe



//#endregion UI




//#region Default JSONs
const defaultJSON = {
    files:[{
        class:HTMLFile.name, name:"index", type: "html", children:[
            {class:HTMLBLOCK.name, name:"!DOCTYPE", canAfter: false, canPrepend: false},
            {class:HTMLBLOCK.name, name: "html", canAfter: false, canPrepend: false, children:[
                {class:HTMLBLOCK.name, name:"head", canAfter: false, children:[
                    {class:HTMLBLOCK.name, name:"meta", attributes:[{class:ATTRIBUTE.name, name:"charset", value:"UTF-8", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class:HTMLBLOCK.name, name:"meta", attributes:[{class:ATTRIBUTE.name, name:"name", value:"viewport", nameEditable: false, valueEditable: false}, {class:ATTRIBUTE.name, name:"content", value:"width=device-width, initial-scale=1.0", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class:HTMLBLOCK.name, name:"title"}
                    ]
                },
                {class:HTMLBLOCK.name, name:"body", canAfter: false}
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