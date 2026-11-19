import { BLOCK } from "../constants";

export const HTMLBLOCK = Object.freeze({
    name: "HTMLBlock",
    tag: "html-block",
    type: Object.freeze({
        ...BLOCK.type,
        ["block"]: new String("block"),
        ["inline"]: new String("inline"),
        ["transparent"]: new String("transparent"),
        ["phrasingonly"]: new String("phrasingonly")
    })
});

export const BREAK = Object.freeze({
    name: "Break",
    tag: "html-br"
});
export const TEXT = Object.freeze({
    name: "HTMLText",
    tag: "html-text"
});

