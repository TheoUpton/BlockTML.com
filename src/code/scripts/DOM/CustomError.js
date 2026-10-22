import { register } from "../utils";

export class CustomError extends HTMLElement{
    constructor(){
        super();
    }
    /**@param {HTMLElement} element */
    static createError(element){
        const custError = document.createElement(CustomError.tag);
        this.fileType = element.file.type;
        element.replaceWith(custError);
        custError.append(element);

    }
    remove(){

    }
    updatePosition(){

    }
    static get tag(){return "cust-error"}
}customElements.define(CustomError.tag, CustomError)
register(CustomError);