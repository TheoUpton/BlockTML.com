import { CustomError } from "./CustomError";
import { CustomPopover } from "./customPopover";
import { register } from "../utils";
import { Tab } from "./tabs";

customElements.define(CustomError.tag, CustomError);
customElements.define(CustomPopover.tag, CustomPopover);
customElements.define("file-tab", Tab);

register(CustomError);
register(Tab);

export { home, navbar, editor } from "./elements";
export { CustomPopover } from "./customPopover";
export { iframe, iframeAnchorScript } from "./iframe";
export { Tab, tabs } from "./tabs";