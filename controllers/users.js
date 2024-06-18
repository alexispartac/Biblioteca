// lista de carti imprumutate
// lista de carti disponibile pentru imprumut
// adaug o noua carte in baza de date
// adaug un nou user in baza de date
// vreau sa stiu daca un user e Admin sau nu (presupunand ca ai salvat informatia asta in baza de date) 
// … poti sa mai adaugi tu


import fs from "fs/promises"
import { MongoClient } from "mongodb"
import mongodb from "mongodb"
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const persoane = require("../lista-persoane.json");
import User from "../model/users.js"

const uri = "mongodb+srv://mateipartac45:Lucaaliuta13$@cluster0.stmiw0l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const col = client.db("biblioteca").collection("users");
const {ObjectId} = mongodb;

// function interogare daca este user
async function user(req){
    const user = await searchUser(req);
    if(!user.roles.Admin)
        return false;
    else
        return true;
}

function schimbareDate(data){
    let dataToString = data.toString();
    let dataToObj = JSON.parse(dataToString);
    let persoane = dataToObj["persoane"];
    return persoane;
};
// functie de permisiune bib
async function permissionLib(req){
    try{
        return await col.findOne({_id: new ObjectId(`${req.headers.idlib}`)})  // header ul converteste in litere mici
    }catch(err){
        return false;
    }
}
//functie de permisiune pers
async function permissionUser(req){
    try{
        return await col.findOne({_id: new ObjectId(`${req.headers.iduser}`)})
    }catch(err){
        return false;
    }
}
// functie de verificare date persoana adaugata 
function verifDateAdd(req){
    const {username, password} = req.body;
    if(!username)
        return "Nu ati introdus numele!"
    if(typeof username !== 'string')
        return "Numele este gresit, trebuie sa contina doar caractere!";
    if(!password)
        return "Nu ati introdus prenumele!"
    if(typeof password !== 'string')
        return "Prenumele este gresit, trebuie sa contina doar caractere!";
    return true;
}
// functie de verificare parametrii de intrare
function verifParamsIn(req){
    const {firstName, lastName, age} = req.query;
    if(!firstName || typeof firstName !== 'string')
        return false;
    if(!lastName || typeof lastName !== 'string')
        return false;
    if(!age || typeof age !== 'string')
        return false;
    return true;
}
//functie cautare persosna
async function searchUser(req){
    // const persoanee = persoane["persoane"]
    // return persoanee.find(persoana => persoana.id  === req.params.id)
    try{
        return await col.findOne({_id: new ObjectId(`${req.params.id}`)})
    }catch(err){
        return false;
    }

}
// functie citire fisier
async function ReadFile(){
    const data = await fs.readFile('lista-persoane.json')
    return schimbareDate(data);
}
// functie scriere fisier 
async function WriteFile(persoane){
    await fs.writeFile('lista-persoane.json', JSON.stringify({"persoane":persoane}))
        console.log(persoane)
    
};

export const listOfUsers = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }
//       const persoane = await ReadFile();
        const users = await col.find({}).maxTimeMS(50).toArray((err, data) => {
            if (err) {
                res.status(400).json({error: 'Ceva nu a mers bine!'})
            }
            return res.json(data);
        });

        res.send({users})
    }catch(error){
        res.status(400).json({error: 'Ceva nu a mers bine!'})
    }
};

export const addUser = async(req, res) => {
    try{
        if(!(permissionLib(req) || permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }

        const verif = verifDateAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }

        const user = new User({...req.body, booksNumberBorrowed: 0, booksToReturn: 0});
        user.save();
        // const persoane = await ReadFile();
        // persoane.push({ ...pers, id: uuidv4()});
        // await WriteFile(persoane);
        await col.insertOne(user)
        res.send({message: `User:${user.username} a fost adaugata!`});
        
    }catch(error){
        res.status(402).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const getUser = async(req, res) => {
    try{
        if(!permissionLib(req)){
            return res.status(401).json({message: "Neautorizat!"})
        }
        if(!verifParamsIn(req)){                                                                // numarul luat ca un string
            return res.status(400).json({message: "Numele, prenumele sau varsta este gresita!"})
        }
        if(!await searchUser(req)){
            return res.status(400).json({message: "User nu exista!"})
        }
        // const persoane = await ReadFile();
        // const foundpers = persoane.find((pers) => pers.id === req.params.id)

        const foundUser = await col.findOne({ _id: new ObjectId(`${req.params.id}`) }); 
        res.status(200).send(foundUser)

    }catch(error){
        res.status(400).json({error: 'Ceva nu a mers bine!'})
    }
};

export const deleteUser = async(req, res) => {
    try{
        if(!permissionLib(req)){
            return res.status(401).json({message: "Neautorizat!"})
        }
        if(!verifParamsIn(req)){
            return res.status(400).json({message: "Numele, prenumele sau varsta este gresita!"})
        }
        if(!await searchUser(req)){
            return res.status(400).json({message: "User ul nu exista!"})
        }

        // const persoane = await ReadFile()    
        // const remainpers = persoane.filter((pers) => pers.id !== req.params.id);
        // await WriteFile(remainpers);

        await col.deleteOne({_id: new ObjectId(`${req.params.id}`)})
        res.send({message: `User:${req.params.id} sters`});
        
    }catch(error){
        res.status(400).json({error: 'Ceva nu a mers bine!'})
    }
    
};

export const updateUser = async(req, res) => {
    try{
        if(!permissionLib(req)){
            return res.status(401).json({message: "Neautorizat!"});
        }
        if(!verifParamsIn(req)){
            return res.status(400).json({message: "Numele, prenumele sau varsta este gresita!"})
        }
        if(!await searchUser(req)){
            return res.status(400).json({message: "User ul nu exista!"})
        }
        
        const verif = verifDateAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }

        // const persoane = await ReadFile();
        // const persoana = persoane.find((pers) => pers.id === req.params.id)
        // if(!persoana){
        //     return res.status(401).json({message: `Persoana cu id ul ${req.params.id} nu exista!`})
        // }

        // persoana.nume = req.body.nume;
        // persoana.prenume = req.body.prenume;
        // persoana.age = req.body.age;
        // await WriteFile(persoane);

        await col.updateOne(
            {_id: new ObjectId(`${req.params.id}`)}, 
            {$set: new Object(req.body)}, 
            {upsert: true}
        )
        
        res.status(200).send(`User:${req.params.id} a fost modificat`)
    }catch(error){
        res.status(400).json({error: 'Ceva nu a mers bine!'})
    }
};