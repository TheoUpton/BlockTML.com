import * as defaults from "./defaults";
import { createFromJSON, populateFromJSON } from "./utils";
import { Folder } from "./filesystem";
import { HTMLFile } from "./filesystem";

export const load = function(){
    for(const file of defaults.JSON.files){
        //Folder.ROOT;
        createFromJSON(Object.assign(file, {parent: Folder.ROOT}));
    }
    for(const setting of defaults.JSON.settings){
        populateFromJSON(setting);
    }
    HTMLFile.populateTemplatePanel(defaults.HTMLTemplatePanel);
}
export const save = function(){

}