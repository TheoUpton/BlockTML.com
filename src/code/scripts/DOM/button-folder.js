import { CustomPopover } from "./customPopover";
import { Folder } from "../filesystem/entries";
import { tabs } from "./tabs";
import { ObjectPath } from "../commands/paths";
import { commandStack } from "../commands/CommandStack";

export const folder = document.getElementById("folder");
/**@type {CustomPopover} */
export const directoryPopover = document.createElement(CustomPopover.tag);
directoryPopover.id = "directoryPopover";
directoryPopover.resizable = true;
directoryPopover.file = Folder.ROOT;
const showUnder = directoryPopover.showUnder;
directoryPopover.showUnder = (...args) => {
    showUnder.call(directoryPopover, ...args);
    folder.textContent = "📂";
}
const remove = directoryPopover.remove;
directoryPopover.remove = () => {
    remove.call(directoryPopover);
    folder.textContent = "📁";
}


//directoryPopover.attachShadow({mode: 'open'})
//directoryPopover.shadowRoot.innerHTML = `<ul><slot></slot></ul>`;
folder.globalLeftClick = () => {
    directoryPopover.replaceChildren();
    folderClicked.call(directoryPopover);
    const button = document.createElement("button");
    button.title = "Add new file or folder";
    button.append("+");
    button.globalLeftClick = ()=>{newFileGUI()};
    directoryPopover.prepend(button);
    directoryPopover.showUnder(folder);
};
function folderClicked(){
    const folder = this.file;
    let list = this.querySelector("ul");
    this.classList[this.classList.contains("closed") ? "remove" : "add"]("closed");
    if(list)
        return ;
    list = document.createElement("ul");
    for(const file of folder.children.values()){
        const item = document.createElement("li");
        item.file = file;
        item.title = file.name
        const name = document.createElement("span");
        name.classList.add("name");
        
        item.appendChild(name);
        if(file instanceof Folder){
            //item.append(file.name);
            const button = document.createElement("button");
            button.title = "Add new file or folder to " + file.name;
            button.append("+");
            button.classList.add("new")
            button.globalLeftClick = ()=>{newFileGUI(file)};
            name.prepend(button);
            item.classList.add("folder", "closed");
            item.globalLeftClick = folderClicked;
        }else{
            
            const type = document.createElement("span");
            type.classList.add("type");
            type.append("."+file.type);
            type.globalLeftClick = (event) => item.globalLeftClick(event);
            item.appendChild(type)
            item.classList.add("file");
            item.title += "."+file.type;
            item.globalLeftClick = () => tabs.addFile(file);
        }
        name.globalLeftClick = (event) => item.globalLeftClick(event);
        const edit = document.createElement("button");
        edit.title = "edit name of " + file.name + (file.type? "."+file.type:"");
        edit.textContent = "✎";
        edit.classList.add("edit");
        edit.globalLeftClick = () => editNameGUI(file);
        name.append(edit);
        name.append(file.name);
        list.appendChild(item);
    }
    //const buttonItem = document.createElement("li");
    //buttonItem.classList.add("button");
    
    
    //buttonItem.append(button);
   
    //list.appendChild(buttonItem);
    this.appendChild(list);
};
function newFileGUI(folder = Folder.ROOT){
    //const parent = this.parentElement
    let fileName = prompt("enter file name and extension");
    while(fileName){
        try{
            const split = fileName.split(".");
            const name = split[0];
            const type = split.length==1 ? "" : split[1];
            /**@type {new} */
            let classRef;
            switch(type){
                case "":
                    classRef = Folder;
                    break;
                case "html":
                    classRef = HTMLFile;
                    break;
                //case "css":
                //    break;
                //case "js":
                //    break;
                default:
                    //file = new File({parent: folder, name: split[0], type: split[1]})
                    throw new Error("invalid file extension");
            }
            const file = new classRef({parent: folder,name:split[0]})
            const filePath = new ObjectPath(file);
            commandStack.inProgress.undo.object  = () => filePath.target;
            commandStack.inProgress.undo.methods = ["delete"];
            commandStack.inProgress.undo.args    = [];
            commandStack.inProgress.redo.object  = Reflect;
            commandStack.inProgress.redo.methods = ["construct"];
            const folderPath = new ObjectPath(folder);
            commandStack.inProgress.redo.args    = [classRef, () =>([{parent: folderPath.target, name:name}])];
            commandStack.inProgress.push();
            break;
        }catch(error){
            fileName = prompt(error.message + "\nenter file name and extension");
        }
    }
    
}
/**@param {Entry} file */
function editNameGUI(file){
    let fileName = prompt("Enter a new name for "+(file instanceof Folder? "folder":"file")+ " "+file.name);
    const oldName = file.name;
    const oldFilePath = new ObjectPath(file);
    while(fileName){
        try{
            file.name = fileName;
            const newFilePath = new ObjectPath(file);
            commandStack.inProgress.undo.object  = () => newFilePath.target;
            commandStack.inProgress.undo.methods = [{method:"name", type:"setter"}];
            commandStack.inProgress.undo.args    = [oldName];
            commandStack.inProgress.redo.object  = () => oldFilePath.target;
            commandStack.inProgress.redo.methods = [{method:"name", type:"setter"}];
            commandStack.inProgress.redo.args    = [fileName];
            commandStack.inProgress.push();
            break;
        }catch(error){
            fileName = prompt(error.message +"\nEnter a new name for "+(file instanceof Folder? "folder":"file")+ " "+file.name);
        }
    }
    
}
function scanHTML(htmlString){

}