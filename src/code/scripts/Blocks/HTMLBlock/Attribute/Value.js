import { AttrSpan } from "./Span";
import { VALUE } from "./constants";
import { valueRulesByName } from "./valueRulesByName";

export class Value extends AttrSpan{
    constructor(){
        super();
    }
    static name = VALUE.name;
    hide(){
        this.style.display = "none";
        this.textContent = "";
    }
    show(){this.removeAttribute("style");}
    set(){console.log("set");super.set();}
    get rules(){
        const attrName = this.attrName.textContent;
        const rules = valueRulesByName[attrName];
        const specificRule = rules[this.elemName];
        return specificRule ? specificRule : rules.generic;
    };
    static get tag(){return VALUE.tag;}
}
customElements.define(VALUE.tag, Value);