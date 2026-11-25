import { ATTRIBUTE, NAME, VALUE } from "./constants";
import { HTMLAttribute } from "./Attribute";
import { Name } from "./Name";
import { Value } from "./Value";
import { register } from "../../../utils";

customElements.define(ATTRIBUTE.tag, HTMLAttribute);
customElements.define(NAME.tag, Name);
customElements.define(VALUE.tag, Value);

register(HTMLAttribute);

export {HTMLAttribute} from "./Attribute";