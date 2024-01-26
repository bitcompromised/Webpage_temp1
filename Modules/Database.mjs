class Entry{
    #f;
    #logs;
    set(key, value){
        this.#logs[key] = value;
        return value;
    }
    delete(key){
        if(this.#logs[key]) delete this.#logs[key];
        return 1;
    }
    get(key, def){
        if(this.#logs[key]) return this.#logs[key];
        else return def ?? null;
    }
    has(key){
        return !!this.#logs[key];
    }
    sort(fn){
        return this.#logs.sort(fn);
    }
    filter(fn){
        return this.#logs.filter(fn);
    }
    save(){
        this.#f.write(this.dir, JSON.stringify(this.#logs))
    }
    get logs(){
        return this.#logs;
    }
    toJson(){
        let _ = {};
        for( let i = 0; i < this.#logs.keys().length; i++){
            _[this.#logs.keys()[i]] = this.#logs.get(this.#logs.keys()[i]);
        }
        return _;
    }
    constructor( f, options, dir, logs){
        this.dir = dir;
        this.#f = f;
        this.#logs = logs || {};

        if(options.persistent_save) {
            this.set = (key, value) => {
                this.#logs[key] = value;
                this.save();
                return value;
            }
            let del = this.delete;
            this.delete = (key) => {
                if(this.#logs[key]) delete this.#logs[key];
                this.save();
                return 1
            }
        }
    }
}
class Database{
    #f;
    #_children;
    #_e = {};
    get( name, options = {persistent_save: false}, def = '{}'){
        name = name.toString().replaceAll(" ","_").replaceAll(":",".")
        if( this.#f.isFile(this.dir+`/${name}.json`)) { // file FOUND!
            return new Entry( this.#f, options, this.dir+`/${name}.json`, JSON.parse(this.#f.open(this.dir+`/${name}.json`).read()));
        } else {
            this.#f.create(this.dir+`/${name}.json`, def);
            return new Entry( this.#f, options, this.dir+`/${name}.json`, def === '{}' ? {} : []);
        }
    }
    has( name){
        return this.#f.isFile(this.dir+`/${name}.json`);
    }
    remove( name){
        if( !this.has( name)) return 1;
        return this.#f.remove(this.dir+`/${name}.json`)
    }
    toJson(){
        return this.#_e;
    }
    constructor( f, dir, children){
        this.dir = dir;
        this.#f = f;
        this.#_children = children;
    }
}
class database {
    #f;
    #loaded = new Map();
    deleteDatabase( databaseName){
        this.#f.remove( `./db/${databaseName}`);
    }
    async getDatabase( databaseName){
        return new Promise( async (resolve)=>{
            if(this.#loaded.has( databaseName)) resolve(this.#loaded.get( databaseName))
            if(this.#f.isFile(`./db/${databaseName}`)){ // DB Exists
                this.#loaded.set( databaseName, new Database( this.#f, `./db/${databaseName}`, []));
                resolve(this.#loaded.get( databaseName));
            } else { // New DB
                this.#f.mkDir( `./db/${databaseName}`);
                this.#loaded.set( databaseName, new Database( this.#f, `./db/${databaseName}`, this.#f.listDir(`./db/${databaseName}`)));
                resolve(this.#loaded.get( databaseName));
            }
        })
    }
    async init(){
        this.#f = await this.modules.get('FileSystem');
        if(!this.#f.isFile('./db'))
            this.#f.mkDir('./db');
        return this;
    }
    constructor(m){
        this.modules = m;
    }
}
let Module = {
    type: "class",
    exports: database
}
export {Module};
