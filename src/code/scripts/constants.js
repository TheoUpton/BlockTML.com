export const BLOCK = Object.freeze({
    name: "Block",
    tag: "custom-block",
    status: Object.freeze({
        template: new String("template"),
        placed: new String("placed"),
        placeholder: new String("placeholder"),
        floating: new String("floating")
    }),
    type: {},
    size: Object.freeze({
        container: new String("container"),
        statement: new String("statement")
    })
});

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

export const ATTRIBUTE = Object.freeze({
    name: "HTMLAttribute",
    tag: "html-attr"
});

export const NAME = Object.freeze({
    name: "name",
    tag: "attr-name"
});

export const VALUE = Object.freeze({
    name: "value",
    tag: "attr-value"
});

export const BREAK = Object.freeze({
    name: "Break",
    tag: "html-br"
});
export const TEXT = Object.freeze({
    name: "HTMLText",
    tag: "html-text"
});

