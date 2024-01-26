function rand( lowest, highest){
    var adjustedHigh = (highest - lowest) + 1;
    return Math.floor(Math.random()*adjustedHigh) + parseFloat(lowest);
}
let Module = {
    type: "class"
}
Module.exports = class{
    #http;
    #https;
    #list;
    #valid = [];
    save( Path='./data/targetsSaveTest.json'){

    }
    Scrape( startingIndex, key){
        let resolver;
        new Promise(async (r)=>{
            resolver = r;
            for(;;){
                let user = await this.#https.get(`https://api.torn.com/user/${ startingIndex++}?selections=&key=${key}`);
                if(!user.error){
                    let tbs = await this.#http.get(`http://www.lol-manager.com/api/battlestats/egMk6ku6yqJkR5mc/2141622/7.6`);
                    if(typeof(tbs) !== 'object')
                        if(toString(tbs).match('error')) {
                            console.log(user.id, tbs);
                            continue;
                        }
                    let entry = {
                        name: user.name,
                        level: user.level,
                        awards: user.awards,
                        age: user.age,
                        honor: user.honor,
                        updated: Date.now(),
                        total: (tbs.TBS_Raw + tbs.TBS + tbs.TBS_Balanced)/3
                    }
                    this.#list.push(entry);
                    this.#list.save();
                } else if( user.error.code === 6){

                }
            }
        })
        while(!resolver){};
        return resolver;
    }
    parse( List){
        List.forEach(user=>{
            if(user.name === 'Javus') return;
            let target = {
                name: user.name,
                age: user.age,
                id: user.id,
                level: user.level,
                awards: user.awards,
                addr: user.addr,
                total: user.prediction.total,
            }
            if(user.prediction.total === 0){
                this.duds.push(target)
            } else {
                if(this.users.filter(t=>t.id === user.id)[0]) return;
                this.users.push(target);
            }
        })
        this.duds.save();
        //this.users.save();
        console.log("Done Parsing");
    }
    get( Amt = 1, Max = 1, Min = 1, key = null) {
        return new Promise( async (resolve, reject)=>{
            let active_list = [];
            let filtered_list = this.#valid.filter(target=> target.total < Max && target.total > Min)
                .sort((a,b)=>a.awards-b.awards);
            for(let i = 0; i < filtered_list.length; i++){
                let target = filtered_list[i];
                try{
                    let u2d = await this.#http.get(`https://api.torn.com/user/${ target.id}?selections=&key=${key}`);
                    //let u2d = {error:{code:2}};
                    if(u2d.error){ if(u2d.error.code === 2)  /* incorrect key */ reject({error:{id:2,error:"Incorrect Key"}});if(u2d.error.code === 6) /* invalid ID */ break; continue;}
                    if(!target.age || u2d.age-target.age > 15) { // Update info every x days
                        let listObj = this.#list.logs[this.#list.logs.indexOf(target)];
                        listObj.age = u2d.age;
                        let tbs = await new Promise((r)=>{
                            this.#http.get({
                                host: `www.lol-manager.com`,
                                port: 80,
                                path: `/api/battlestats/egMk6ku6yqJkR5mc/${ root[user].id}/8.9.3/`,
                                method: 'GET',
                            }, (res) => {
                                var data = [];
                                res.on("data", chunk=>{
                                    data.push( chunk)
                                })
                                res.on( "end", ()=>{
                                    try {
                                        if (JSON.parse(Buffer.concat(data).toString())) {
                                            r(JSON.parse(Buffer.concat(data).toString()))
                                        }
                                    } catch(err){
                                        r(Buffer.concat(data).toString())
                                    }
                                })
                            })
                        })
                        if(typeof(tbs) !== 'object')
                            if(tbs.toString().match('error')) {
                                console.log(target.id, tbs);
                                continue;
                            }
                        else
                            listObj.total = (tbs.TBS_Raw + tbs.TBS + tbs.TBS_Balanced)/3
                        this.#list.save();
                    }
                    if(u2d.status.state === "Okay"){
                        active_list.push(target);
                        new Promise(r=>{
                            let t = this.#valid.splice(this.#valid.indexOf(target), 1);
                            setTimeout(r, 3* 60* 1000*60); // 3 minutes to refresh?
                            this.#valid.push(t);
                        })
                    } else {
                        let toWait = Date.now() - u2d.status.until *1000 + (3 * 60 * 60 * 1000);
                        new Promise(async(r)=>{
                            let t = this.#valid.splice(this.#valid.indexOf(target), 1);
                            setTimeout((r)=> {
                                r(this.#valid.push(t));
                            }, toWait ?? 60* 1000*60);
                        })
                    }
                } catch(err){
                    reject(err);
                }
                if(active_list.length >= Amt) return resolve(active_list);
                await new Promise(r=>setTimeout(r, 1000));
            }
            return resolve(active_list);

        })
    }
    async update(){

        let root = this.#list.logs
            .sort((a,b)=>a.total-b.total)
            .filter(Entry=> !Entry.updated || Date.now()-Entry.updated > 15*24*60*60*1000 || Entry.total <= 0);
        console.log("Updating ", root.length);
        for (const user in root){
            try{
                let Entry = root[user];
                if(Entry.updated && Date.now()-Entry.updated < 15*24*60*60*1000) continue;
                let u2d = await this.http.get(`https://api.torn.com/user/${ root[user].id}?selections=&key=QR1nghu9W1UZM3Zb`);
                if(u2d.error) continue;
                if(!Entry.age || Entry.age - u2d.age > 15){ // Need to Update
                    //console.clear()
                    //console.log(`Updating [${root[user].name}] ${user}/${root.length} Users`)
                    let tbs = await new Promise((r)=>{
                        this.#http.get({
                            host: `www.lol-manager.com`,
                            port: 80,
                            path: `/api/battlestats/egMk6ku6yqJkR5mc/${ root[user].id}/8.9.3/`,
                            method: 'GET',
                        }, (res) => {
                            var data = [];
                            res.on("data", chunk=>{
                                data.push( chunk)
                            })
                            res.on( "end", ()=>{
                                r(JSON.parse(Buffer.concat(data).toString()))
                            })
                        })
                    })
                    if((tbs.TBS_Raw + tbs.TBS + tbs.TBS_Balanced)/3 > 1){
                        //console.log(`Old: ${Entry.total}, New: ${(tbs.TBS_Raw + tbs.TBS + tbs.TBS_Balanced)/3}`);
                        Entry.total = (tbs.TBS_Raw + tbs.TBS + tbs.TBS_Balanced)/3;
                    }
                    Entry.age = u2d.age;
                    Entry.level = u2d.level;
                    Entry.awards = u2d.awards;
                    Entry.updated = Date.now();
                    this.#list.save();
                }
            } catch(err){
                console.log("Http Error: ", err);
                console.log(`Updating [${root[user].name}] ${user}/${root.length} Users`)
            }
            await new Promise(r=>setTimeout(r, rand(2500,5500)));
        }
    }
    async init(){
        this.http = await this.modules.get("Http");
        this.fs = await this.modules.get("FileSystem");
        return this;
    }
    constructor( Modules, http, https, tdb, duds){
        this.modules = Modules;
        this.#http = http;
        this.#https = https;
        this.#list = tdb;
        this.#valid = tdb;
    }
}
export {Module};




/*
Get users from Database
Initialize all users to Active
As you encounter a injured or permed user, remove them from the queue (?to readd later), remove from database and save database
 */
