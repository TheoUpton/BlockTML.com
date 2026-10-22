import { register } from "../../utils";
import { BLOCK } from "../constants";
import { HTMLBlock } from "./HTMLBlock";
import { BREAK } from "./constants";

export class Break extends HTMLBlock{
    #breakElement = document.createElement("br");
    constructor(){super();}
    static name = BREAK.name;
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
}customElements.define(BREAK.tag, Break);
register(Break);
