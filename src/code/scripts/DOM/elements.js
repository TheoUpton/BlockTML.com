import { Folder } from "../filesystem";
import { iframe } from "./iframe";

export const home = document.getElementById("home");
home.globalLeftClick = () => {
    //console.log("home pressed")
    //debugger;
    const file = Folder.ROOT.children.get("html", "index");
    navbar.textContent = "/index.html";
    iframe.render(file);
};
const refresh = document.getElementById("refresh");
refresh.globalLeftClick = () => {iframe.render(iframe.renderedFile);};

export const navbar = document.getElementById("navbar");

export const editor = document.getElementById("editor");