//#region ******Global******



import { bindEvents } from "./event-handling/bindEvents";
import { load } from "./persistence";
import "./DOM";
import "./Blocks/HTMLBlock";

bindEvents();
load();


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







//#region *******CSS*******

//#endregion **CSS**





//#region ********JS********

//#endregion **JS**



//#region ********UI********





//#region iframe









//#endregion iframe



//#endregion UI

