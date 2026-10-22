import { register, createFromJSON, isString } from "../utils";
import { CountMap } from "../structures/CountMap";
import { File, Folder } from "../filesystem";
import { BLOCK } from "../Blocks/constants";
import { HTMLBLOCK } from "../Blocks/HTMLBlock/constants";
import { propertiesByName } from "../Blocks/HTMLBlock/propertiesByName";

export class HTMLFile extends File{
    #classes= new HTMLFile.#ClassMap(); #ids = new HTMLFile.#IdSet();
    constructor({name, parent = Folder.ROOT, children = defaults.JSON.files[0].children, viewable = true, contentEditable = true, metaEditable = true}){
        super({name, type:"html", parent, children, viewable, contentEditable, metaEditable});
    }

    static populateTemplatePanel(JSON){
        HTMLFile.#templatePanel.id = "html-template-panel";
        for(const containerJSON of JSON){
            const container = document.createElement("div");
            container.id = containerJSON.id;
            container.replaceChildren(...containerJSON.children.map(child => 
                createFromJSON(Object.assign({class:HTMLBLOCK.name, name:child, status:BLOCK.status.template}, propertiesByName[child]))
            ));
            HTMLFile.#templatePanel.append(container);
        }
    }

    get classes(){return this.#classes}
    get ids(){return this.#ids;}
    
    display(){
        const editor = document.getElementById("editor");
        editor.setAttribute("data-file-type", "html");
        editor.appendChild(HTMLFile.#templatePanel);
        editor.appendChild(this.childrenElement);
        //editor.replaceChildren(...this.children);
    }
    hide(){

    }
    
    get prerender(){
        let prerender = super.prerender;
        if(prerender.length >0)
            return prerender;
        this.children.forEach(child => prerender.push(...child.prerender()));
        return prerender;
    }
    clearPrerender(){super.prerender.clear()}
    render(){return this.prerender.reduce((accumulator, currentValue) => accumulator + isString(currentValue)? currentValue: currentValue.target.render(),"");}
    
    static #templatePanel= document.createElement("div");
    static #allClasses = new CountMap(); 
    static #allIds = new CountMap();
    static #ClassMap = class ClassMap extends CountMap{
        decrement(...objs){objs.forEach(obj => {if(super.decrement(obj) == 0) HTMLFile.allClasses.decrement(obj)});}
        increment(...objs){objs.forEach(obj => {if(super.increment(obj) == 1) HTMLFile.allClasses.increment(obj)});}
    }
    static #IdSet = class IdSet extends Set{
        add(obj){
            if(this.has(obj))
                return false;
            super.add(obj);
            HTMLFile.allIds.increment(obj);
        }
        delete(obj){
            if(!this.has(obj))
                return false;
            super.delete(obj);
            HTMLFile.allIds.decrement(obj);
        }
    }
    static get allClasses(){return HTMLFile.#allClasses;}
    static get allIds(){return HTMLFile.#allIds}
    static get templatePanel(){return HTMLFile.#templatePanel;}
}register(HTMLFile);