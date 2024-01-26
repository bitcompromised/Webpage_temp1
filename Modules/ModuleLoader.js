import fs from "fs";
import https from "https";
import crypto from "crypto";
export default class ModuleLoader{
    imports = {fs, https, crypto};
    #modules = new Map();
    async get( module, ...c){
        if(this.#modules.has(module))
            return (this.#modules.get(module));
        else {
            if(this.imports[module])
                return (this.imports[module]);
            else if(fs.existsSync(`./Modules/${module}.mjs`)) {
                let m = (await import(`./${module}.mjs`)).Module

                if(m.type === 'class') {
                    let clss = new m.exports(this, ...c)
                    this.#modules.set(module, clss);
                    return (clss);
                } else {
                    this.#modules.set(module, m.exports);
                    return (m.exports);
                }
            } else throw new Error(`Module Get Error [${module}, ${c}]`);
        }
    }
}
