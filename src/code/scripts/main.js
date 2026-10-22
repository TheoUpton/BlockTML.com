//#region ******Global******



import {register, createFromJSON, populateFromJSON, isString} from "./utils";
import { CountMap } from "./structures/CountMap";
import { ObjectPath } from "./commands/paths";
import { bindEvents } from "./event-handling/bindEvents";
import { File, Folder } from "./entries";
import { BLOCK } from "./Blocks/constants";
import { HTMLBLOCK, ATTRIBUTE } from "./Blocks/HTMLBlock/constants";
import "./DOM";
import "./Blocks/HTMLBlock/HTMLBreakElement";
import "./Blocks/HTMLBlock/text"

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











//#region ****Block Class***





//#endregion **Block CLass**





//#region *******HTML******





//#region HTML File



class HTMLFile extends File{
    //#region __construction
    #classes= new HTMLFile.#ClassMap(); #ids = new HTMLFile.#IdSet();
    constructor({name, parent = Folder.ROOT, children = defaultJSON.files[0].children, viewable = true, contentEditable = true, metaEditable = true}){
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
    //#endregion construction
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
    //#region __statics
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
    //#endregion statics
}register(HTMLFile);
//#endregion HTML File


//#endregion **HTML**





//#region *******CSS*******

//#endregion **CSS**





//#region ********JS********

//#endregion **JS**



//#region ********UI********





//#region iframe









//#endregion iframe



//#endregion UI




//#region Default JSONs
const defaultJSON = {
    files:[{
        class:HTMLFile.name, name:"index", type: "html", children:[
            {class:HTMLBLOCK.name, name:"!DOCTYPE", canAfter: false, canPrepend: false},
            {class:HTMLBLOCK.name, name: "html", canAfter: false, canPrepend: false, children:[
                {class:HTMLBLOCK.name, name:"head", canAfter: false, children:[
                    {class:HTMLBLOCK.name, name:"meta", attributes:[{class:ATTRIBUTE.name, name:"charset", value:"UTF-8", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class:HTMLBLOCK.name, name:"meta", attributes:[{class:ATTRIBUTE.name, name:"name", value:"viewport", nameEditable: false, valueEditable: false}, {class:ATTRIBUTE.name, name:"content", value:"width=device-width, initial-scale=1.0", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class:HTMLBLOCK.name, name:"title"}
                    ]
                },
                {class:HTMLBLOCK.name, name:"body", canAfter: false}
            ]}
        ]
    }],
    settings:[
        {object:"tabs", focusIndex: 0, tabs:[
            {class: ObjectPath.name, path:[{/*getter:"children", method:"get",*/methods: ["children", "get"], params:["html", "index"]}]}
            ]
        }
    ]
};
const defaultHTMLTemplatePanel = [
    {id:"Text", children:["text", "h1","h2","h3","h4","h5","h6","p","a","br","hr","b","del","em","i","mark","q","s","small","sub","sup","u"]},
    {id:"Formatting", children:[]},
    {id: "Layout", children:["header","main","footer","article","aside","details","dialog","section","search","summary"]},
    {id:"Forms", children:["form","input","textarea","button","select","optgroup","option","label","fieldset","legend","datalist","output"]},
    {id:"Media", children:["img", "figure","figcaption","map","picture","audio","video","source",]}, 
    {id:"lists", children:["ul","ol","li","dl","dt","dd"]},
    {id:"Tables", children:["table","caption","th","tr","td","thead","tbody","tfoot","colgroup","col",]},
    {id:"Programming", children:["script", "link"]}
];
//#endregion default JSONs

//#region ***Server Interactions***
load = function(){
    for(const file of defaultJSON.files){
        //Folder.ROOT;
        createFromJSON(Object.assign(file, {parent: Folder.ROOT}));
    }
    for(const setting of defaultJSON.settings){
        populateFromJSON(setting);
    }
    HTMLFile.populateTemplatePanel(defaultHTMLTemplatePanel);
}
load();
save = function(){

}
//#endregion server interactions