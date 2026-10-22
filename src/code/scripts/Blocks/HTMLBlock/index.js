import { HTMLBLOCK, BREAK, TEXT } from "./constants";
import { HTMLBlock } from "./HTMLBlock";
import { Break } from "./BreakElement";
import { HTMLText } from "./text";
import { register } from "../../utils";

customElements.define(HTMLBLOCK.tag, HTMLBlock);
customElements.define(TEXT.tag, HTMLText);
customElements.define(BREAK.tag, Break);

register(HTMLBlock);
register(HTMLText);
register(Break);

export { HTMLBlock } from "./HTMLBlock";
export { Break } from "./BreakElement";
export { HTMLText } from "./text";