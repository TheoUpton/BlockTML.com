//#region ******Global******



import { createFromJSON, populateFromJSON } from "./utils";
import { bindEvents } from "./event-handling/bindEvents";
import { Folder } from "./filesystem";
import "./DOM";
import "./Blocks/HTMLBlock";
import * as defaults from "./defaults";

bindEvents();


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


//#region ***Server Interactions***
load = function(){
    for(const file of defaults.JSON.files){
        //Folder.ROOT;
        createFromJSON(Object.assign(file, {parent: Folder.ROOT}));
    }
    for(const setting of defaults.JSON.settings){
        populateFromJSON(setting);
    }
    HTMLFile.populateTemplatePanel(defaults.HTMLTemplatePanel);
}
load();
save = function(){

}
//#endregion server interactions