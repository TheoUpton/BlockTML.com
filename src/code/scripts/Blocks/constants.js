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