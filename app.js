import express from 'express';
import session from 'express-session';
import Modules from './Modules/ModuleLoaderV2.js';

let modules = new Modules;

let FileSys = await (await modules.get( "FileSystem")).init(); // +
let http = await (await modules.get( "Http")).init(); // +
let crypt = await (await modules.get( "Crypt", "This is secret Key")).init(); // +
let db = await (await modules.get("Database")).init(); // +

let targetdb = await db.getDatabase("targets"); // +?
let targetUsers = targetdb.get("users"); // +?

let authdb = await db.getDatabase("authentication"); // +?
let authUsers = authdb.get("users", {persistent_save: true}); // +?

let authenticator = await modules.get("authenticator", http, authUsers); // ???
let torn_AttackListOperator = await (await modules.get( "TORN_AttackList", targetUsers)).init(); // ???




const app = express();

app.use(express.static('public/pages'));

app.use(session({
    resave: false,
    saveUninitialized: true,
    secret: '',
    cookie: {
        maxAge: 604800000,
    }
}))

app.listen(80, async () => {
    console.log(`Server is running on port ${80}`);
});
