import { Command } from "./Command";

export const commandStack = new (class {
    #undoStack = [];
    #redoStack = [];
    constructor(){}
    get _undoStack(){return this.#undoStack;}
    get _redoStack(){return this.#redoStack;}
    undo(){
        if(this._undoStack.length == 0)
            return;
        const command = this._undoStack.pop();
        command.undo.execute();
        this._redoStack.push(command);
    }
    redo(){
        if(this._redoStack.length == 0)
            return;
        const command = this._redoStack.pop();
        command.redo.execute();
        this._undoStack.push(command);
    }
    /**
     * 
     * @param {Object} options
     * @param {Command} options.undo
     * @param {Command} options.redo 
     */
    /*pushCopy({undo, redo}){
        //if(this.#undoStack.length < savepoint.undostacklength)
        //    savepoint.undostacklength = null;
        this.#undoStack.push({undo: undo.copy(), redo: redo.copy()});
        this.#redoStack.length = 0;
    }*/
    push({undo, redo}){
        this._undoStack.push({undo: undo, redo: redo});
        this._redoStack.length = 0;
    }
    #inProgress = new (class{
        #undo = new Command();
        #redo = new Command();
        get undo(){return this.#undo;}
        get redo(){return this.#redo;}


        clear(){
            //this.undo.clear();
            this.#undo = new Command();
            //this.redo.clear();
            this.#redo = new Command();
        }
        push(){
            if(this.undo.isEmpty() && this.redo.isEmpty())
                return;
            commandStack.push({undo: this.undo, redo: this.redo});
            this.clear();
            //console.info("command pushed!");
        }
        print(){console.error("command in progress", this.undo, this.redo);}
    });
    get inProgress(){return this.#inProgress};
})();