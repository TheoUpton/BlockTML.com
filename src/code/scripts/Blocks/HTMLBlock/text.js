import { register } from "../../utils";
import { Block } from "../Block";
import { BLOCK } from "../constants";
import { HTMLBlock } from "./HTMLBlock";
import { HTMLBLOCK, TEXT } from "./constants";

export class HTMLText extends Block{
    constructor(){
        super();
    }
    static name = TEXT.name;
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
}customElements.define(TEXT.tag, HTMLText);
register(HTMLText);
