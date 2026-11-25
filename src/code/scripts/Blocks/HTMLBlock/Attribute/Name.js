import { NAME } from "./constants";
import { AttrSpan } from "./Span";
import { nameRulesByTag } from "./nameRulesByTag";

export class Name extends AttrSpan{
    constructor(){
        super();
    }
    static key = NAME.key;
    set(){
        const name = this.textContent;
        this.blur();
        if(name === "")
            return super.set();
        //const elemName = this.parentElement.parent.name;
        const elemAttrNames = nameRulesByTag[this.elemName]
        if(!(elemAttrNames && elemAttrNames.has(name)) && !nameRulesByTag.global.has(name)){
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
    static get tag(){return NAME.tag;}
}