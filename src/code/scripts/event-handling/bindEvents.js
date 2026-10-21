import { eventHandler } from "./eventHandler";
import { iframe } from "../DOM/iframe";

export function bindEvents(){
    //pointer
    document.addEventListener("pointerdown", eventHandler.pointerDown.bind(eventHandler));
    document.addEventListener("pointercancel", eventHandler.pointerCancel.bind(eventHandler));
    document.addEventListener("pointerup", eventHandler.pointerUp.bind(eventHandler));
    /*document.addEventListener("pointerrawupdate", (event) => {
        if(event.buttons < eventHandler.activePointers.get(event.pointerId).buttons)
            eventHandler.pointerUp(event);
    });*/
    document.addEventListener("pointermove", eventHandler.pointerMove.bind(eventHandler));
    //document.body.addEventListener("pointerout", eventHandler.pointerOut.bind(eventHandler));
    //keyboard
    document.addEventListener('keydown', eventHandler.keyPressed.bind(eventHandler));
    document.addEventListener("input", eventHandler.input.bind(eventHandler));


    window.addEventListener("blur", (event)=>{
        setTimeout(() => {
            if(document.activeElement === iframe)
                eventHandler._tellListeningObjects("globalLeftClick", {target: document.activeElement});
            else
                eventHandler.windowBlurred.bind(eventHandler)(event);
        })
    });
}