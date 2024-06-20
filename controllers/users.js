// lista de carti imprumutate
// lista de carti disponibile pentru imprumut
// adaug o noua carte in baza de date
// adaug un nou user in baza de date
// vreau sa stiu daca un user e Admin sau nu (presupunand ca ai salvat informatia asta in baza de date) 
// … poti sa mai adaugi tu


import fs from "fs/promises"
import { v4 as uuidv4, v1 as uuidv1 } from 'uuid';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const users = require("../ListOfUsers.json");
const librarians = require("../ListOfLibrarians.json");
const books = require("../ListOfBooks.json");

// function interogare daca este user
async function user(req){
    const user = await searchUser(req);
    if(!user.roles.Admin)
        return false;
    else
        return true;
}

function changeData(data, col){
    let dataToString = data.toString();
    let dataToObj = JSON.parse(dataToString);
    let books = dataToObj[col];
    return books;
};
// functie de permisiune bib
async function permissionLib(req){
    try{
        const Librarians = await ReadFile("ListOfLibrarians.json", "librarians")
        return Librarians.find(lib => lib.id  === req.headers.idlib)
    }catch(err){
        return false;
    }
}
//functie de permisiune pers
async function permissionUser(req){
    try{
        const Users = await ReadFile("ListOfUsers.json", "users")
        return Users.find(user => user.id  === req.headers.iduser)
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
    const Users = await ReadFile('ListOfUsers.json', "users")
    return Users.find(user => user.id  === req.params.id)
}

// functie citire fisier
//file:String, col:String
async function ReadFile(file, col){
    const data = await fs.readFile(file)
    return changeData(data, col);
}

// functie scriere fisier 
//file:String, col:Array
async function WriteFile(file, data){
    await fs.writeFile(file, JSON.stringify({ users: data}))
};

export const listOfUsers = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }

        const users = await ReadFile("ListOfUsers.json", "users");
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

        const user = req.body;
        const users = await ReadFile("ListOfUsers.json", "users");
        users.push({ 
            id: uuidv4(),
            ...user,
            roles: {
                User: uuidv1()
            },
            numberBorrowedBooks: 0,
            borrowedBookRemain: 0
        });
        await WriteFile("ListOfUsers.json", users, "users");
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

        const users = await ReadFile("ListOfUsers.json", "users");
        const foundUser = users.find(user => user.id === req.params.id)
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

        const users = await ReadFile("ListOfUsers.json", "users")    
        const usersR = users.filter(user => user.id !== req.params.id);
        await WriteFile("ListOfUsers.json", usersR);
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

        const users = await ReadFile("ListOfUsers.json", "users");
        const user = users.find(user => user.id === req.params.id)
        if(!user){
            return res.status(401).json({message: `Persoana cu id ul ${req.params.id} nu exista!`})
        }

        user.username = req.body.username;
        user.password = req.body.password;
        await WriteFile("ListOfUsers.json", users);
        res.status(200).send(`User:${req.params.id} a fost modificat`)
    }catch(error){
        res.status(400).json({error: 'Ceva nu a mers bine!'})
    }
};