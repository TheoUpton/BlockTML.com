import { register } from "../../../utils";
import { AttrSpan } from "./Span";
import { ATTRIBUTE, NAME, VALUE } from "../../../constants";
import { nameRulesByTag } from "./nameRulesByTag";
import { valueRulesByName } from "./valueRulesByName";

export class HTMLAttribute extends HTMLElement{
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
    
    //#endregion super class
    //#region ____AttrName class
    static AttrName = class AttrName extends AttrSpan{
        constructor(){
            super();
        }
        set(){
            const name = this.textContent;
            this.blur();
            if(name === "")
                return super.set();
            //const elemName = this.parentElement.parent.name;
            const elemAttrNames = nameRulesByTag[this.elemName]
            if(!(elemAttrNames && elemAttrNames.has(name)) && !nameRulesByTag.global.has(name)){
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
        static get tag(){return "attr-name";}
    }
    //#endregion namespan




    //#region ____AttrValue Class
    static AttrValue = class AttrValue extends AttrSpan{
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
            const rules = valueRulesByName[attrName];
            const specificRule = rules[this.elemName];
            return specificRule ? specificRule : rules.generic;
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