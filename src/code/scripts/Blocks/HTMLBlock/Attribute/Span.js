import { createFromJSON } from "../../../utils";
import { ObjectPath } from "../../../commands/paths";
import { commandStack } from "../../../commands/CommandStack";

export class AttrSpan extends HTMLElement{
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