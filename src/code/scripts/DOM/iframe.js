const navbar = document.getElementById("navbar");
import { ObjectPath } from "../commands/paths";

export const iframe = document.getElementById("renderer");
iframe.write = function(data){
    this.contentDocument.open();
    this.contentDocument.write(data);
    this.contentDocument.close();
}
iframe.render = function(file){
    if(!file){return false;}
    const render = file.render();
    console.log(render);
    iframe.write(render);
    iframe.renderedFile = file;
    return true;
}

export const iframeAnchorScript =
     '<script>'
        +'document.addEventListener("click", (event) => {'
            +'const anchor = event.target.closest("a");'
            //+'console.log("iframe clicked", anchor);'
            +'if (!anchor) return;'
            +'event.preventDefault();'
            +'window.parent.postMessage({ type: "linkClick", href: anchor.getAttribute("href") }, "*");'
        +'});'
    +'</script>'
;

window.addEventListener("message", (event) => {
    console.log(event.data);
    if(event.data.type == "linkClick"){
        const file = ObjectPath.locateFromString(event.data.href, iframe.renderedFile);
        if(iframe.render(file))
            navbar.textContent = event.data.href;
    }
});