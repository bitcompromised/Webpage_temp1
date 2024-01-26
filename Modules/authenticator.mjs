class Authenticator{
    #db;
    #http;
    #crypt;
    #payments;
    async #g(){
        return this.#db;
    }
    async validate( Key){
        return 1;
        let userProfile = await this.#http.get(`https://api.torn.com/user/0?selections=&key=${Key}`);
        if( userProfile.error)
            return -1;
        let playerId = userProfile.player_id;
        if(this.#db.has( playerId)){
            if(new Date(this.#db.get( playerId).expr) >= new Date( Date.now())){
                return 1;
            } else {
                return 0;
            }
        } else { // Create Temporary Residency
            let entry = {
                expr: Date.now() + 3.5*24*60*60*1000, // 3.5day temp
                Key,
                sharekey: null
            }
            this.#db.set(playerId, entry);
            return 1;
        }
    }
    InitPaymentSystem(){
        return new Promise(async()=>{
            while(true){
                let curLogs = this.#http.get("https://api.torn.com/user/0?selections=newevents&key=15GFI7BPHyNnrnQW")
                    .then(res=>{
                        for(const event in res.events){
                            let Event = res.events[event];
                            let payment_hash = event;
                            let timestamp = Event.timestamp;
                            let user = Event.event.match(/>(\w+)</g)[0].replace(">","").replace("<","");
                            let message = Event.event.match(/\w+ \d+ x \w+/g)[0];
                            let data = {
                                payment_hash,
                                timestamp,
                                user,
                                message
                            }
                            if(message.match(/\w+/g)[0] === "sent" && message.match(/x \w+/g)[0].replace("x ", "") === "xanax" && !this.#payments.has( payment_hash)){
                                let time = message.match(/\d+/)[0]* 14*24*60*60*1000; // 14 days
                                let id = Event.event.match(/XID=\d+/g)[0].replace("XID=", "")
                                this.#payments.set( payment_hash, data);
                                if(this.#db.has(id)){
                                    let entry = this.#db.get(id);
                                    if(entry.expr < Date.now()){
                                        entry.expr = Date.now() + time;
                                        this.#db.set(id, entry);
                                    } else {
                                        entry.expr += time;
                                        this.#db.set(id, entry);
                                    }
                                } else { // Create new USER based on Payment
                                    let entry = {
                                        expr: Date.now()+ time,
                                    }
                                    this.#db.set(id, entry);
                                }
                            }
                        }
                    })
                await new Promise((r)=>setTimeout(r, 15 *1000*60)) // 15 Minutes
            }
        })

    }
    constructor( modules, httpClient, userdb, paymentdb, crypt){
        this.#http = httpClient
        this.#db = userdb;
        this.#payments = paymentdb;
        this.#crypt = crypt;
    }
}
let Module = {
    type: "class",
    exports: Authenticator
}
export { Module }
