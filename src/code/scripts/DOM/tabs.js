import { ObjectPath } from "../commands/paths";
import { editor } from "./elements";

export const tabs = (function(){
    const element = document.getElementById("tabs");
    element.childNodes.forEach(node => {
        if(node.nodeName == "#text")
            node.remove();
    });
    element.files = new WeakMap();
    let focus;
    element.populateFromJSON = function(JSON){
        JSON.tabs.forEach(objectpath => element.addFile(ObjectPath.locateFromJSON(objectpath.path)));
        element.setFocus(element.childNodes[JSON.focusIndex]);
    };
    element.toJSON = function(){
        const childrenArray = Array.from(element.children);
        return{
            object: "tabs", 
            tabs: childrenArray.map(tab => new ObjectPath(tab.file)),
            focusIndex: childrenArray.indexOf(focus)
        };
    };
    element.addFile = function(file){
        if(element.files.has(file))
            return;
        const tab = Tab.create(file);
        element.files.set(file, tab);
        element.appendChild(tab);
    };
    element.removeFile = function(file){
        if(!element.files.has(file))
            return;//throw new Error(`File ${file} is not a tab in the tabs section`);
        element.removeTab(element.files.get(file));
        //hide that file from display
        //load neighbouring tab
        //remove tab
    };
    element.removeTab = function(tab){
        if(tab === focus)
            focus = undefined;
        element.files.delete(tab.file)
        tab.file.unload();
        tab.remove();
    };
    element.setFocus = function(tab){
        if(tab instanceof File)
            tab = element.files.get(tab);
        if(tab === focus)
            return;
        if(focus !== undefined){
            focus.classList.remove("tabs-focus");
            editor.replaceChildren();
        }
        focus = tab;
        focus.classList.add("tabs-focus");
        focus.file.display();
    };
    const placeholder = document.createElement("div");
    element._initialiseDrag = function(event){
        //get dimensions of clicked tab
        //set placeholder dimensions to match
        
        element.dragging(true);
        tabs.setPointerCapture(event.pointerId);
    };
    element._pointerDrag = function(event){
        
    };
    element._pointerCancel = function(event){


        element.dragging(false);
    };
    element._dragEnd = function(event){


        element.dragging(false);
    };
    element.dragging = function(bool){
        tabs.globalPointerDrag = bool? element._pointerDrag : undefined;
        tabs.globalPointerCancel = bool? element._pointerCancel : undefined;
        tabs.globalDragEnd = bool? element._dragEnd : undefined;
    };
    return element;
})();

export class Tab extends HTMLElement{
    #nameElement= document.createElement("span"); #typeElement = document.createElement("span");
    constructor(){
        super();
        //this.#nameElement = document.createElement("span");
        this.nameElement.classList.add("file-name");
        this.nameElement.parent = this;
        this.nameElement.globalLeftClick = this.childrenLeftClickEvent;
        this.nameElement.globalInitialiseDrag = this.childrenInitialiseDrag;
        this.nameElement.globalMiddleClick = this.globalMiddleClick.bind(this);
        
        //this.#typeElement = document.createElement("span");
        this.typeElement.classList.add("file-type");
        this.typeElement.parent = this;
        this.typeElement.globalLeftClick = this.childrenLeftClickEvent;
        this.typeElement.globalInitialiseDrag = this.childrenInitialiseDrag;
        this.typeElement.globalMiddleClick = this.globalMiddleClick.bind(this);
    }
    get nameElement(){return this.#nameElement;}
    get typeElement(){return this.#typeElement;}
    static create(file){
        const tab = document.createElement("file-tab");
        tab._file = file;


        tab.nameElement.textContent = file.name;
        tab.appendChild(tab.nameElement);
        
        tab.append(".");


        tab.typeElement.textContent = file.type;
        tab.appendChild(tab.typeElement);
        
        file.load();


        return tab;
    }
    get file(){return this._file;}
    childrenLeftClickEvent(event){
        this.parent.setPointerCapture(event.pointerId);
        this.parent.globalLeftClick(event);
    }
    childrenInitialiseDrag(event){
        this.parent.setPointerCapture(event.pointerId);
        tabs.globalIinitialiseDrag(event);
    }
    globalLeftClick(event){
        tabs.setFocus(this);
    }
    globalMiddleClick(event){
        //add close tab to the command stack
    }
    globalInitialiseDrag(event){
        tabs.globalInitialiseDrag(event);
    }
}
customElements.define("file-tab", Tab);
register(Tab);