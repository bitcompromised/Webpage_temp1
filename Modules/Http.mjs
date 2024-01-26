let Module = {type:"class"};
class Http{
    #http;
    get( Address){
        return new Promise(async (resolve, reject) =>{
            try {
                await this.#http.get(Address, res => {
                    let data = [];
                    res.on('data', chunk => {
                        data.push(chunk);
                    });
                    res.on('end', () => {
                        let res;
                        try{
                            res = JSON.parse(Buffer.concat(data).toString());
                        } catch(err){
                            res = Buffer.concat(data).toString()
                        }
                        resolve(res); // resolve the promise with the response
                    });
                });
            } catch ( err ) {
                reject( err);
            }
        })
    }
    ping(){
        return new Promise( async(resolve, reject)=>{
            this.get(`https://echo.jsontest.com/test/${Date.now()}`)
                .then(async(time)=>{
                    await new Promise(r=> setTimeout( r, 1000));
                    this.get(`https://echo.jsontest.com/test/${Date.now()}`)
                        .then(newTime=>resolve(newTime-time))
                        .catch(err=>reject(err));
                })
                .catch(err=>reject(err));
        })
    }
    async init(){
        this.#http = await this.modules.get("https");
        return this;
    }
    constructor( m) {
        this.modules = m;
    }
}
Module.exports = Http;
export {Module};
