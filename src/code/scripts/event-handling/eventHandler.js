import { newListeningObjects } from "./newListeningObjects";
import { isString } from "../utils";
import { commandStack } from "../commands/CommandStack";

export const eventHandler = new (class{
    #activePointers = new Map();
    get activePointers(){return this.#activePointers;}
    #pointerState = "none";
    /** @returns {"none" | "single" | "multi"} */
    get pointerState(){return this.#pointerState}
    get RIGHTCLICKDURATION(){return 500;}
    get TOLERANCESQUARED(){return 100;}
    updatePointerState(){
        if(this.activePointers.size == 0)
            return this.#pointerState = "none";
        if(this.pointerState === "multi")
            return this.#pointerState = "multi";
        return this.#pointerState = (this.activePointers.size > 1) ? "multi" : "single";
    }
    
    eventFired(type, event, call = true){
        if(typeof event.target[type] !== "function")
            return;
        if(call)
            event.target[type](event);
        return event.target;
    }
    //#region _tell listening objects
    _tellListeningObjects(types, event){
        if(isString(types))
            types = [types];
        for(const type of types){
            if(!newListeningObjects.has(type))
                continue;
            newListeningObjects.get(type).forEach(object => {
                if(typeof object[type] !== "function")
                    throw new Error(`Listening object ${object} does not have the method ${type} that it is listening for`);
                if(event.target !== object)
                    object[type](event);
            });
        }
    }
    //#endregion tell listening objects




    //#region pointerDown
        pointerDown(event){
            //update buttons if another button has been clicked for that pointer
            if(this.activePointers.has(event.pointerId))
                Object.assign(this.activePointers.get(event.pointerId), {buttons: event.buttons});
            else
                this.activePointers.set(event.pointerId, {start:{x: event.clientX, y: event.clientY}, state:"static", downTime: Date.now(), buttons: event.buttons});
            this.updatePointerState();
            event.composedPath()[0].setPointerCapture(event.pointerId);
            this._tellListeningObjects(["globalPointerDown"], event);
            this.eventFired("globalPointerDown", event);
        }
    //#endregion pointerdown




    //#region pointerUp
        pointerUp(event){
            if(!this.activePointers.has(event.pointerId))
                return;
            let method = "";
            if(this.activePointers.get(event.pointerId).state === "static"){
                if (event.button == 2 || (event.pointerType === "touch" && Date.now() - this.activePointers.get(event.pointerId).downTime > this.RIGHTCLICKDURATION))
                    method = "globalRightClick";
                else if (event.button == 1)
                    method = "globalMiddleClick";
                else if (event.button == 0)
                    method = "globalLeftClick";
            }
            else
                method = "globalPointerDragEnd"
            if(method === "")
                return;
            if(event.buttons == 0){
                this._tellListeningObjects([method], event);
                this.eventFired(method, event);
                this.activePointers.delete(event.pointerId);
                this.updatePointerState();
            }
            else
                Object.assign(this.activePointers.get(event.pointerId), {buttons: event.buttons});
        }
    //#endregion pointerUp




    //#region pointerMove
    pointerMove(event){ 
        //checks if it's a plain mouse movement
        if(event.buttons === 0)
            return; //this.pointerHover(event);
        //check pointer is in valid position on screen (i.e. not on the final pixel of the edge)
        //if(event.clientX === 0 || event.clientX === window.innerWidth - 1 || event.clientY === 0 | event.clientY === window.innerHeight - 1)
        //    return this.pointerCancel(event);
        //skip if original target did not have a drag method
        if(event.target === document)
            return;
        
        
        if(this.activePointers.get(event.pointerId).state === "static"){
            const start = this.activePointers.get(event.pointerId).start;
            if((start.x-event.clientX)**2 + (start.y-event.clientY)**2 <= this.TOLERANCESQUARED)
                return;
            
            this.activePointers.get(event.pointerId).state = "moving";
            Object.assign(event, {start:start});
            this.eventFired("globalInitialiseDrag", event);
        }else{
            this._tellListeningObjects("globalPointerDrag", event);
            const target = this.eventFired("globalPointerDrag", event);
            if(target === undefined)
                document.body.setPointerCapture(event.pointerId);
        }
    }
    //#endregion pointerMove
    pointerHover(event){
        this.eventFired(["globalPointerHover"], event);
    }
    pointerOut(event){
        this.eventFired(["globalPointerOut"], event);
    }
    pointerCancel(event){
        this.eventFired(["globalPointerCancel"], event);
    }
    allPointersCancel(event){


    }
    windowBlurred(event){


    }
    keyPressed(event){
        if ((event.ctrlKey || event.metaKey) && ((event.key.toLowerCase() == 'y' && !event.shiftKey ) || (event.shiftKey && event.key.toLowerCase() == 'z')) && !event.altKey) {
            event.preventDefault();
            commandStack.redo()
            return;
        }else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() == 'z'  && !event.altKey) {
            //console.log("undo")
            event.preventDefault();
            commandStack.undo();
            return;
        }else if(event.key === "Escape"){
            this._tellListeningObjects("globalCancel", event);
            this.eventFired("globalCancel", event);
            return;
        }
        this._tellListeningObjects("globalKeyDown", event);
        this.eventFired("globalKeyDown", event);
    }
    input(event){
        this._tellListeningObjects("globalInput", event);
        this.eventFired("globalInput", event);
    }
})();