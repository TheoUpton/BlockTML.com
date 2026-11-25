import { Block } from "../Block";
import { createFromJSON } from "../../utils";
import { SemiString } from "../../structures/SemiString";
import { HTMLAttribute } from "./Attribute";
import { iframeAnchorScript } from "../../DOM/iframe";
import { BLOCK } from "../constants";
import { HTMLBLOCK } from "./constants";
import { propertiesByName } from "./propertiesByName";

//#region __html block template
const htmlBlockTemplate = (function(){
    const template = document.getElementById(HTMLBLOCK.tag);
    template.content.childNodes.forEach(node => {
        if(node.nodeName == "#text")
            node.remove();
    })
    return template;
})();
//#endregion html block template




export class HTMLBlock extends Block{
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
    static get tag(){return HTMLBLOCK.tag;}
    //#endregion statics
}
//#endregion HTML Block