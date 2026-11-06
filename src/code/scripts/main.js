//#region ******Global******



import {register, createFromJSON, populateFromJSON, isString} from "./utils";
import { SemiString } from "./structures/SemiString";
import { CountMap } from "./structures/CountMap";
import { ObjectPath } from "./commands/paths";
import { bindEvents } from "./event-handling/bindEvents";
import { File, Folder } from "./entries";
import { BLOCK, HTMLBLOCK, ATTRIBUTE, BREAK, TEXT } from "./constants"
import { Block } from "./Blocks/Block";
import { iframeAnchorScript } from "./DOM";
import { HTMLAttribute } from "./Blocks/HTMLBlock/Attribute/Attribute";
import { propertiesByName } from "./Blocks/HTMLBlock/propertiesByName";

bindEvents();


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
                createFromJSON(Object.assign({class:HTMLBLOCK.name, name:child, status:BLOCK.status.template}, propertiesByName[child]))
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
        const elementProperties = propertiesByName[JSON.name];
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