import { HTMLFile } from "./filesystem";
import { ObjectPath } from "./commands/paths";
import { HTMLBLOCK } from "./Blocks/HTMLBlock/constants";

export const JSON = {
    files:[{
        class:HTMLFile.name, name:"index", type: "html", children:[
            {class: HTMLBLOCK.name, name:"!DOCTYPE", canAfter: false, canPrepend: false},
            {class: HTMLBLOCK.name, name: "html", canAfter: false, canPrepend: false, children:[
                {class: HTMLBLOCK.name, name:"head", canAfter: false, children:[
                    {class: HTMLBLOCK.name, name:"meta", attributes:[{class:"HTMLAttribute", name:"charset", value:"UTF-8", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class: HTMLBLOCK.name, name:"meta", attributes:[{class:"HTMLAttribute", name:"name", value:"viewport", nameEditable: false, valueEditable: false}, {class:"HTMLAttribute", name:"content", value:"width=device-width, initial-scale=1.0", nameEditable: false, valueEditable: false}], draggable:false, canAddAttributes:false},
                    {class: HTMLBLOCK.name, name:"title"}
                    ]
                },
                {class: HTMLBLOCK.name, name:"body", canAfter: false}
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

export const HTMLTemplatePanel = [
    {id:"Text", children:["text", "h1","h2","h3","h4","h5","h6","p","a","br","hr","b","del","em","i","mark","q","s","small","sub","sup","u"]},
    {id:"Formatting", children:[]},
    {id: "Layout", children:["header","main","footer","article","aside","details","dialog","section","search","summary"]},
    {id:"Forms", children:["form","input","textarea","button","select","optgroup","option","label","fieldset","legend","datalist","output"]},
    {id:"Media", children:["img", "figure","figcaption","map","picture","audio","video","source",]}, 
    {id:"lists", children:["ul","ol","li","dl","dt","dd"]},
    {id:"Tables", children:["table","caption","th","tr","td","thead","tbody","tfoot","colgroup","col",]},
    {id:"Programming", children:["script", "link"]}
];