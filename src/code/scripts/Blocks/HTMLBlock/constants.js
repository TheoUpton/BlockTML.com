import { BLOCK } from "../constants";

export const HTMLBLOCK = Object.freeze({
    key: "HTMLBlock",
    tag: "html-block",
    type: Object.freeze({
        ...BLOCK.type,
        ["block"]: new String("block"),
        ["inline"]: new String("inline"),
        ["transparent"]: new String("transparent"),
        ["phrasingonly"]: new String("phrasingonly")
    })
});

export { ATTRIBUTE } from "./Attribute/constants";

export const BREAK = Object.freeze({
    key: "Break",
    tag: "html-br"
});
export const TEXT = Object.freeze({
    key: "HTMLText",
    tag: "html-text"
});

