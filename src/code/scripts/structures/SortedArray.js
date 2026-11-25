export class SortedArray extends Array {
    constructor(compareFn = (a, b) => String(a).localeCompare(String(b, undefined, { sensitivity: 'base' }))) {
        super();
        this.compare = compareFn;
    }


    push(...items) {
        for (const item of items) {
            let low = 0;
            let high = this.length;
            // Binary search for correct insert position
            while (low < high) {
                let mid = (low + high) >> 1;
                if (this.compare(item, this[mid]) > 0) 
                    low = mid + 1;
                else 
                    high = mid;
            }
            super.splice(low, 0, item); // insert at the sorted position
        }
        return this.length;
    }
    indexOf(item){
        let low = 0;
        let high = this.length;
        // Binary search for correct insert position
        while (low < high) {
            let mid = (low + high) >> 1;
            if (this.compare(item, this[mid]) > 0) 
                low = mid + 1;
            else 
                high = mid;
        }
        return this[low] === item ? low : -1;
    }
    delete(item){
        const index = this.indexOf(item);
        if(index > -1)
            this.splice(index, 1);
    }
}