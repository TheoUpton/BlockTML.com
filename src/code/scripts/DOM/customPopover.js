import { newListeningObjects } from "../event-handling/newListeningObjects";
import { Coord } from "../structures/Coord";

export class CustomPopover extends HTMLElement{
    constructor(){
        super();
    }
    get resizable(){return this.classList.has("resizable");}
    set resizable(bool){this.classList[bool ? "add" : "remove"]("resizable");}
    /** @param {HTMLElement} callingElement  */
    showUnder(callingElement){
        if(!callingElement.isConnected)
            throw new Error(`Element ${callingElement} is not connected to DOM`)
        this.callingElement = callingElement;
        const callingRect = callingElement.getBoundingClientRect();
        let ancestor = callingElement;
        while (ancestor && window.getComputedStyle(ancestor).position === 'static') 
            ancestor = ancestor.parentElement;
        const ancestorRect = ancestor ? ancestor.getBoundingClientRect() : {top: 0, left: 0};
        Object.assign(this.style, {top: callingRect.bottom - ancestorRect.top+ "px",left: callingRect.left - ancestorRect.left + "px",});
        callingElement.after(this);
        newListeningObjects.set("globalLeftClick", this);
    }
    remove(){
        delete this.callingElement;
        HTMLElement.prototype.remove.call(this);
        newListeningObjects.delete("globalLeftClick", this);
        return false;
    }
    globalPointerDown(event){
        event.preventDefault();
        const rect = this.getBoundingClientRect();
        this.offset = new Coord(rect.right - event.clientX, rect.bottom - event.clientY);
    }
    globalLeftClick(event){
        if(!this.callingElement.contains(event.target) && !this.contains(event.target))
            return this.remove();
    }
    globalInitialiseDrag(event){this.dragging = this.offset.isIn({left: 0, right: 16, top: 0, bottom: 16});}
    globalPointerDrag(event){
        const rect = this.getBoundingClientRect();
        Object.assign(this.style, {
            width:event.clientX + this.offset.x - rect.left+"px", 
            height:event.clientY + this.offset.y - rect.top+"px"
        });
    }
    set dragging(bool){
        if(bool){
            delete this.globalPointerDrag;
            Object.defineProperty(this, "globalInitialiseDrag", {value: undefined,enumerable: false,configurable: true});
        }else{
            Object.defineProperty(this, "globalPointerDrag", {value: undefined,enumerable: false,configurable: true});
            delete this.globalInitialiseDrag;
        }
    }
    globalPointerDragEnd(event){this.dragging = false;}

    static get tag(){return "pop-over";}
}customElements.define(CustomPopover.tag, CustomPopover)