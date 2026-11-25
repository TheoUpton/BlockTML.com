import { bindEvents } from "./event-handling/bindEvents";
import { load } from "./persistence";
import "./DOM";
import "./Blocks/HTMLBlock";

bindEvents();
load();
