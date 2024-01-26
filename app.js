import express from 'express';
import session from 'express-session';
import Modules from './Modules/ModuleLoader.js';

let modules = new Modules;

let FileSys = await (await modules.get( "FileSystem")).init(); // +
let http = await (await modules.get( "Http")).init(); // +
let crypt = await (await modules.get( "Crypt", "This is secret Key")).init(); // +
let db = await (await modules.get("Database")).init(); // +

let logs = (await db.getDatabase("logs")).get(new Date(Date.now()), {persistent_save: true})

let targetdb = await db.getDatabase("targets"); // +?
let targetUsers = targetdb.get("users", {persistent_save: false}, '[]'); // +?
let dudTargets = targetdb.get("duds", {persistent_save: false}, '[]')

let authdb = await db.getDatabase("authentication"); // +?
let authUsers = authdb.get("users", {persistent_save: true}); // +?
let authPayments = authdb.get("payments", {persistent_save: true}); // +?

let authenticator = await modules.get("authenticator", http, authUsers, authPayments, crypt); // ???
authenticator.InitPaymentSystem();
let torn_AttackListOperator = await (await modules.get( "TORN_AttackList", http, targetUsers, dudTargets)).init(); // ???


// npm install express express-session crypto
const app = express();

app.use(express.static('public/pages'));

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: 'a1b2c3d4e5f6g7h8i9j0kzlymxnwovpuqtrs',
    cookie: {
        maxAge: 604800000,
    }
}))

app.get('/scan/:Amt/:tbsMax/:tbsMin/:key',async (request, response)=>{
    // log[] 1.1.1.1 : [key:user[id]]
    let args = request.params
    if( !args.key) return response.json({error: "no key"});
    if( args.tbsMax === args.tbxMin || args.tbsMin > args.tbxMax) return response.json({error: "incorrect tbs args"});
    let ip = request.ip.match(/::....:(.*)/)[1] || request.ip;

    var myDate = new Date(Date.now())
    var estDate = myDate.toLocaleString("en-US", {
        timeZone: "America/New_York"
    })
    let authed = await authenticator.validate( args.key);
    logs.set(estDate.replace(" AM",`${Date.now() %1000} AM`).replace(" PM",`${Date.now() %1000} PM`), {ip, session_id: request.session.id, authed, args});

    // Authenticate User
    switch(authed){
        case 1: // Auth Cleared
            let targets = await torn_AttackListOperator.get(Math.min(args.Amt, 5), Math.min( 9e12, args.tbsMax), Math.max(0, args.tbsMin), args.key);
            //if (targets === -1) return response.json({error:"invalid key"});
            console.log("target: ",targets);
            return response.json(targets);
        case 0: // Auth Error
            return response.json({error:"Expired"});
        case -1: // Key Error
            return response.json({error:"Incorrect Key"});
    }
    response.json([args, ip]);
})
app.get('/addtime/:userid/:ms', async(request)=>{

})
const log = console.log;
app.listen(80, async () => {
    console.log(`Server is running on port ${80}`);
    log(targetUsers.length);
    log(dudTargets.length);
});
