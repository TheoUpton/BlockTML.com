import { register, inputRegexes } from "../../../utils";
import { AttrSpan } from "./Span";
import { ATTRIBUTE, NAME, VALUE } from "../../../constants";

export class HTMLAttribute extends HTMLElement{
    //#region __construction
    #nameSpan; #valueSpan; #file; #name;#value;
    constructor(){
        super();
    }
    /** @returns {HTMLAttribute}*/
    static createFromJSON({name = undefined, value = undefined, file, nameEditable = true, valueEditable = true, hoverable = true}){
        const attribute = document.createElement(ATTRIBUTE.tag);
        attribute.spellcheck = false;
        attribute.append(attribute.nameSpan);
        attribute.append(attribute.valueSpan);
        Object.assign(attribute, {name, value, file, nameEditable, valueEditable, hoverable});
        return attribute;
    }
    toJSON(){
        return {
            class: ATTRIBUTE.name,
            name: this.name,
            value: this.value,
            nameEditable: this.nameEditable,
            valueEditable: this.valueEditable
        }
    }
    pathFromParent(){
        return{
            //getter: "attributes",
            //method: "at",
            methods: ["attributes", "at"],
            params: [this.parent.attributes.indexOf(this)]
        };
    }
    //#endregion construction





    prerender(){
        //const semiString = new SemiString(" " + this.nameSpan.textContent);
        //if(this.value !== undefined)
        //    semiString.push("=\"", this.value,"\"")
        //return semiString;
        return " " + this.nameSpan.textContent + (this.value? "=\""+this.valueSpan.textContent +"\"": "");
    }
    
    removeEvents(){

    }
    //#region __getters & setters
        /** @returns {InstanceType<typeof HTMLAttribute.AttrName>}*/
        get nameSpan(){
            if(this.#nameSpan !== undefined)
                return this.#nameSpan;
            if(this.childElementCount == 2)
                return this.#nameSpan = this.childNodes[0];
            return this.#nameSpan = document.createElement(NAME.tag);
        }
        /**@returns {string} */
        get name(){return this.#name;}
        set name(name){
            if(this.name == "class")
                this.file.classes.decrement(...this.value.split(" "));
            else if(this.name == "id")
                this.file.ids.delete(this.value);
            this.#name = name;
            this.nameSpan.textContent = name ? name : "";
        }
        /**@returns {HTMLFile} */
        get file(){return this.#file;}
        set file(file){
            if(this.file === undefined)
                this.value = this.value;
            return this.#file = file;
        }
        /** @returns {InstanceType<typeof HTMLAttribute.AttrValue>}*/
        get valueSpan(){
            if(this.#valueSpan !== undefined)
                return this.#valueSpan;
            if(this.childElementCount == 2)
                return this.#valueSpan = this.childNodes[1];
            return this.#valueSpan = document.createElement(VALUE.tag);
        }
        get value(){return this.#value;}
        set value(value){
            if(this.file === undefined);
            else if(this.name == "class")
                this.file.classes.increment(...value.split(" "));
            else if(this.name == "id")
                this.file.ids.add(value);
            else if(this.name == "href"){
                
            }
            this.#value = value;
            if(value !== undefined){
                this.valueSpan.textContent = value;
                this.valueSpan.removeAttribute("style");
            }
            else{
                this.valueSpan.textContent = "";
                this.valueSpan.style.display = "none";
            }
        }
        get nameEditable(){return this.nameSpan.editable;}
        set nameEditable(editable){this.nameSpan.editable = editable;}
        get valueEditable(){return this.valueSpan.editable;}
        set valueEditable(editable){this.valueSpan.editable = editable;}
        /**@returns {IterableIterator<HTMLAttribute>}*/
        get siblingAttributes(){
            return (function*(){
                const attributes = this.parentElement.attributes;
                for(const attribute of attributes)
                    if(attribute !== this)
                        yield attribute;
            }).bind(this);
        }
        get parent(){return this.parentNode.parentNode;}
        set(name, value = undefined){
            //could improve efficiency for setting classes etc
            return Object.assign(this, {name, value});
        }
    //#endregion getters & setters
    calculateBlockPlacement(coord){
        this.parentElement.parentElement.calculateBlockPlacement(coord);
    }
    getPlacedBlock(coord){return this.parentElement.parentElement;}
    getMethod(coord){return "prepend";}
    remove(){
        this.nameSpan
        HTMLElement.prototype.remove.call(this);
    }
    //#region __Sub classes





    //#region ____Super Class: AttrSpan
    
    //#endregion super class
    //#region ____AttrName class
    static AttrName = class AttrName extends AttrSpan{
        constructor(){
            super();
        }
        set(){
            const name = this.textContent;
            this.blur();
            if(name === "")
                return super.set();
            //const elemName = this.parentElement.parent.name;
            const elemAttrNames = AttrName.byTag[this.elemName]
            if(!(elemAttrNames && elemAttrNames.has(name)) && !AttrName.byTag.global.has(name)){
                this.textContent = "";
                return super.set();
            }
            //const valueSpan = this.parentElement.valueSpan;
            //const ruleGroup = HTMLAttribute.AttrValue.rulesByAttrName[name];
            //const rule = Object.hasOwn(ruleGroup, elemName) ? ruleGroup[elemName] : ruleGroup.generic;
            const isEmptyVal = this.attrValue.rules.type == "empty";
            if(isEmptyVal){
                this.attrValue.style.display = "none";
                return super.set();
            }
            this.attrValue.removeAttribute("style");
            this.attrValue.textContent = "";
            this.attrValue.select();
        }
        get rules(){return {
            regexes: [/(?<!^data)-/gi, /[^a-z-]/gi],
            case: "lower"
        };};
        static byTag = {
            global: new Set(["id", "class","accesskey", "contenteditable", "dir", "draggable", "enterkeyhint", "hidden", "inert", "inputmode", "popover", "spellcheck", "style", "tabindex", "title", "translate"]),
                 a: new Set(["download", "href", "hreflang", "media", "rel", "target", "type"]),
              area: new Set(["alt", "coords", "download", "href", "hreflang", "media", "rel", "shape", "target"]),
             audio: new Set(["autoplay", "controls", "loop", "muted", "preload", "src"]),
              base: new Set(["href", "target"]),
        blockquote: new Set(["cite"]),
            button: new Set(["autofocus", "disabled", "form", "formaction", "name", "popovertarget", "popovertargetaction", "type", "value"]),
            canvas: new Set(["height", "width"]),
               col: new Set(["span"]),
          colgroup: new Set(["span"]),
               del: new Set(["cite", "datetime"]),
           details: new Set(["open"]),
             embed: new Set(["height", "src", "type", "width"]),
          fieldset: new Set(["disabled", "form", "name"]),
              form: new Set(["accept-charset", "action", "autocomplete", "enctype", "method", "name", "novalidate", "rel", "target"]),
            iframe: new Set(["height", "name", "sanbox", "src", "srcdoc", "width"]),
               img: new Set(["alt", "height", "ismap", "src", "srcset", "usemap", "width"]),
             input: new Set(["accept", "alt", "autocomplete", "autofocus", "checked", "dirname", "disabled", "form", "formaction", "height", "list", "max", "maxlength", "mind", "multiple", "name", "pattern", "placeholder", "popovertarget", "popovertargetaction", "readonly", "rel", "size", "src", "step", "type", "value", "width"]),
               ins: new Set(["cite", "datetime"]),
             label: new Set(["for", "form"]),
                li: new Set(["value"]),
              link: new Set(["href", "hreflang", "media", "rel", "type"]),
               map: new Set(["name"]),
              menu: new Set(["type"]),
              meta: new Set(["charset", "content", "http-equiv", "name"]),
             meter: new Set(["form", "high", "low", "max", "mind", "optimum", "value"]),
            object: new Set(["data", "height", "name", "type", "usemap", "width"]),
                ol: new Set(["reversed", "start"]),
          optgroup: new Set(["disabled", "label"]),
            option: new Set(["disabled", "label", "selected", "value"]),
            output: new Set(["for", "form", "name"]),
             param: new Set(["name", "value"]),
          progress: new Set(["max", "value"]),
                 q: new Set(["cite"]),
            script: new Set(["async", "charset", "defer", "src", "type"]),
            select: new Set(["autofocus", "disabled", "form", "multiple", "name", "required", "size"]),
            source: new Set(["media", "src", "srcset", "type"]),
             style: new Set(["media", "type"]),
                td: new Set(["colspan", "headers", "rowspan"]),
          textarea: new Set(["autofocus", "cols", "dirname", "disabled", "form", "maxlength", "name", "placeholder", "readonly", "required", "rows", "wrap"]),
                th: new Set(["colspan", "headers", "rowspan", "scope"]),
              time: new Set(["datetime"]),
             track: new Set(["default", "kind", "label", "src", "srclang"]),
             video: new Set(["autoplay", "controls", "height", "loop", "muted", "poster", "preload", "src", "width"])
        };
        static get tag(){return "attr-name";}
    }
    //#endregion namespan




    //#region ____AttrValue Class
    static AttrValue = class AttrValue extends AttrSpan{
        constructor(){
            super();
        }
        hide(){
            this.style.display = "none";
            this.textContent = "";
        }
        show(){this.removeAttribute("style");}
        set(){console.log("set");super.set();}
        get rules(){
            const attrName = this.attrName.textContent;
            const rules = AttrValue.rulesByAttrName[attrName];
            const specificRule = rules[this.elemName];
            return specificRule ? specificRule : rules.generic;
        };
        static rulesByAttrName = {
            accept:{generic:{type:"stringlist", list:["audio/*", "video/*", "image/*"], case:"lower", separator: ",", regexes:[/[^a-z/\*]/gi]}}, //also accepts tile extensions, can be multiple
            acceptcharset:{generic:{type:"stringlist", case: "upper", regexes:[/[^a-z\d\-]/gi],list:["UTF-8", "ISO-8859-1"]}}, 
            accesskey:{generic:{type:"string", case:"lower", regexes:inputRegexes.letter}},//restrict to length 1
            //action:{}, redacted currently
            alt:{generic:{type:"string", regexes: []}},
            async:{generic:{type:"empty"}},
            autocomplete:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["on", "off"]}},
            autofocus:{generic:{type:"empty"}},
            autoplay:{generic:{type:"empty"}},
            charset:{generic:{type:"fixed", value:"UTF-8"}},
            checked:{generic:{type:"empty"}},
            cite:{generic:{type:"Ext-URL"}},
            class:{generic:{type:"string", caseSensitive: true, regexes: inputRegexes.identifier, separator:" "}}, //return to class later
            cols:{generic:{type: "string", regexes: inputRegexes.naturals}},
            colspan:{generic:{type: "string", regexes: inputRegexes.naturals}},
            content:{generic:{type:"string"}}, //more complicated
            contenteditable:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["true", "false"]}},
            controls:{generic:{type:"empty"}},
            coords:{generic:{type: "string", regexes: [/[^\d,]/g], separator:","}}, //simplified
            //data-*:{},
            data:{generic:{type:"URL", file:"generic"}}, //generic files are not js and css
            datetime:{},
            default:{generic:{type:"empty"}},
            defer:{generic:{type:"empty"}},
            dir:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["rtl","ltr","auto"]}},
            dirname:{generic:{type:"empty"}},
            disabled:{generic:{type:"empty"}},
            download:{generic:{type:"empty"}},
            draggable:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["true", "false"]}},
            enctype:{generic:{type:"stringlist", case:"lower", regexes:[/ [^a-z/\-]/gi], list:["application/x-www-form-urlencoded", "multipart/form-data", "text/plain"]}}, //only used with method="post"
            enterkeyhint:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["done", "enter", "go", "next", "previous", "search", "send"]}},
            for:{},
            form:{},
            formaction:{},
            headers:{},
            height:{generic:{type: "string", regexes: inputRegexes.naturals}},
            hidden:{generic:{type:"empty"}},
            high:{generic:{type: "string", regexes: inputRegexes.reals}}, //simplified
            href:{generic: {type: "URL", regexes: inputRegexes.posix}, link:{type: "Int-URL", file: "css", regexes: inputRegexes.posix}},
            hreflang:{generic:{type:"language", list:[]}},
            httpequiv:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.lettersHyphenated, list:["content-security-policy", "content-type", "default-style", "refresh"]}},
            id:{generic:{type: "string", caseSensitive: true, regexes:inputRegexes.identifier}}, //return to ID later?
            inert:{generic:{type:"empty"}},
            inputmode:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["none", "text", "decimal", "numeric", "tel", "search", "email", "url"]}},
            ismap:{generic:{type:"empty"}},
            kind:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["subtitles", "captions", "chapters", "metadata"]}},
            label:{generic:{type:"string", regexes: []}},
            list:{},
            loop:{generic:{type:"empty"}},
            low:{generic:{type: "string", regexes: inputRegexes.reals}},
            max:{generic:{type: "string", regexes: inputRegexes.reals}},//if<input type="date"> is date
            maxlength:{generic:{type: "string", regexes: inputRegexes.naturals}}, 
            media:{}, //complicated
            method:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["get","post"]}},
            min:{generic:{type: "string", regexes: inputRegexes.reals}},
            multiple:{generic:{type:"empty"}},
            muted:{generic:{type:"empty"}},
            name:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.lettersHyphenated, list:["application-name", "author", "description", "generator", "keywords", "referrer", "theme-color", "color-scheme", "viewport"]}},
            novalidate:{generic:{type:"empty"}},
            open:{generic:{type:"empty"}},
            optimum:{generic:{type: "string", regexes: inputRegexes.reals}},
            //pattern:{generic:{type:"regex"}}, //very complicated
            placeholder:{generic:{type:"string"}},
            popover:{generic:{type:"empty"}},
            popovertarget:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["show", "hide", "toggle"]}},
            popovertargetaction:{},
            poster:{generic:{type: "URL", file:"image"}},
            preload:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["none", "metadata","auto"]}},
            readonly:{generic:{type:"empty"}},
            rel:{a:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["alternate", "author", "bookmark", "external", "help", "license", "next", "nofollow", "noopener", "noreferrer", "prev", "search", "tag"]},
                area:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["alternate", "author", "bookmark", "help", "license", "next", "nofollow", "noreferrer", "prefetch", "prev", "search", "tag"]},
                link:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["alternate", "author", "dns-prefetch", "help", "icon", "license", "next", "pingback", "preconnect", "prefetch", "prerender", "prev", "search", "stylesheet"]},
                form:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["external", "help", "license", "next", "nofollow", "noopener", "noreferrer", "opener", "prev", "search"]}},
            required:{generic:{type:"empty"}},
            reversed:{generic:{type:"empty"}},
            rows:{generic:{type: "string", regexes: inputRegexes.naturals}},
            rowspan:{generic:{type: "string", regexes: inputRegexes.naturals}},
            sandbox:{generic:{type:"empty"}},
            scope:{generic:{type:"stringlist", list:["col", "row", "colgroup", "rowgroup"], case:"lower", regexes:inputRegexes.letters}},
            selected:{generic:{type:"empty"}},
            shape:{generic:{type:"stringlist", list:["default", "rect", "circle", "poly"], case:"lower", regexes:inputRegexes.letters}},
            size:{generic:{type: "string", regexes: inputRegexes.naturals}},
            span:{generic:{type: "string", regexes: inputRegexes.naturals}},
            spellcheck:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["true", "false"]}},
            src:{audio:{type:"URL", file:"audio"}, embed:{type:"URL", file:"generic"}, iframe:{type:"URL", file:"html"}, img:{type:"URL", file:"image"}, input:{type:"URL", file:"image"},script:{type: "Int-URL", file: "js"}, source:{type:"URL", file:"media"}, track:{type:"URL", file:"vtt"}, video:{type:"URL", file:"video"}},
            srcdoc:{},
            srclang:{generic:{type:"language"}},
            srcset:{generic:{type: "URL", file:"image"}},
            start:{generic:{type: "string", regexes: inputRegexes.integers}},
            step:{generic:{type: "string", regexes: inputRegexes.integers}},
            //style:{},
            tabindex:{generic:{type: "string", regexes: inputRegexes.integers}},
            target:{generic:{type:"stringlist", case: "lower", regexes:[/[^a-z]/gi, /(?!^)_/g], list:["_blank","_self", "_parent", "_top", "framename"]}},
            title:{generic:{type:"string", regexes: []}},
            translate:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["no", "yes"]}},
            type:{generic:{type:"media_type"},
                button:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["button", "submit", "reset"]},
                input:{type:"stringlist", case:"lower", regexes:inputRegexes.lettersHyphenated, list:["button", "checkbox", "color", "date", "datatime-local", "email", "file", "hidden", "image", "month", "number", "password", "radio", "range", "reset", "search", "tel", "text", "time", "url", "week"]},
                menu:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["list", "context", "toolbar"]},
                script:{type:"fixed", vale:""}},// scripttype
            usemap:{},
            value:{button:{type:"string", regexes: []}, input:{type:"string", regexes: []}, option:{type:"string", regexes: []}, li:{type:"string", regexes: inputRegexes.integers}, meter:{type:"string", regexes: inputRegexes.reals}, progress:{type:"string", regexes: inputRegexes.reals}, param:{type:"string", regexes:[]}}, //more research about the numbers
            width:{generic:{type: "string", regexes: inputRegexes.naturals}},
            wrap:{generic:{type:"stringlist", case:"lower", regexes:inputRegexes.letters, list:["soft", "hard"]}},
        };
        static get tag(){return "attr-value";}
    }
    //#endregion valuespan
    //#endregion __nested classes
    /*static stringListELement = document.createElement(CustomPopover.tag);
    static {
        this.stringListELement.attachShadow({mode: 'open'})
        this.stringListELement.shadowRoot.innerHTML = `<ul><slot></slot></ul>`;
    };*/
    static get tag(){return "html-attr";}
}customElements.define(ATTRIBUTE.tag, HTMLAttribute);
customElements.define(NAME.tag, HTMLAttribute.AttrName);
customElements.define(VALUE.tag, HTMLAttribute.AttrValue);
register(HTMLAttribute);