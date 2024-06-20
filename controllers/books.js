/*
middlewere
codurile de status

*/
// interogari cu matrice

import fs from "fs/promises"
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const users = require("../ListOfUsers.json");
const librarians = require("../ListOfLibrarians.json");
const books = require("../ListOfBooks.json");

function changeData(data, col){
    let dataToString = data.toString();
    let dataToObj = JSON.parse(dataToString);
    let books = dataToObj[col];
    return books;
};

async function updateUser(user, incOrdec){
    if(incOrdec == 1){
        user.numberBorrowedBooks++;
        user.borrowedBookRemain++;
    }
    if(incOrdec == -1){
        user.borrowedBookRemain--;
    }
    return user;
}

async function permissionLib(req){
    try{
        const Librarians = await ReadFile("ListOfLibrarians.json", "librarians")
        return Librarians.find(lib => lib.id  === req.headers.idlib)
    }catch(err){
        return false;
    }
}

async function permissionUser(req){
    try{
        const Users = await ReadFile("ListOfUsers.json", "users")
        return Users.find(user => user.id  === req.headers.iduser)
    }catch(err){
        return false;
    }
}

function verifDataAdd(req){
    const {nume, autor} = req.body; 
    if(!nume)
        return "Nu ati introdus numele cartii!"
    if(typeof nume !== 'string')
        return "Numele cartii este gresit, trebuie sa contina doar caractere!";
    if(!autor)
        return "Nu ati introdus numele autorului!"
    if(typeof autor !== 'string')
        return "Numele autorului este gresit, trebuie sa contina doar caractere!";
    return true;
}

function verifParamsIn(req){
    const {nume, autor} = req.query;
    if(!nume || typeof nume !== 'string')
        return false;
    if(!autor || typeof autor !== 'string')
        return false;
    return true;
}

async function searchBook(req){
    const Books = await ReadFile('ListOfBooks.json', "books")
    return Books.find(book => book.id  === req.params.id)
}

async function searchUser(username){
    const Users = await ReadFile('ListOfUsers.json', "users")
    return Users.find(user => user.username  === username)
}

//file:String, col:String
async function ReadFile(file, col){
    const data = await fs.readFile(file)
    return changeData(data, col);
}
//file:String, col:Array
async function WriteFile(file, data){
    await fs.writeFile(file, JSON.stringify({books:data}))
};


export const listOfBooks = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }

        const books = await ReadFile("ListOfBooks.json", "books");
        res.send({books})
    }catch(error){
        res.status(401).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const listOfBooksAvailable = async(req, res) => {
    try{
        if(!(permissionLib(req) || permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }

        const books = await ReadFile("ListOfBooks.json", "books");
        const booksAvailable = books.filter(book => book.borrowedBook === false );
        res.send({booksAvailable})

    }catch(error){
        res.status(401).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const listOfBooksBorr = async(req, res) => {
    try{
        if(!(permissionLib(req) || permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }
        
        const books = await ReadFile("ListOfBooks.json", "books");
        const borrowedBooks = books.find(book => book.borrowedBook === true );

        res.send({borrowedBooks})
    }catch(error){
        res.status(401).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const addBook = async(req, res) => {
    try{
        if(!await permissionLib(req)){
            return res.status(401).json({message: "Neautorizat!"})
        }

        const verif = verifDataAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }
        
        const body = req.body;
        body.borrowedBook = false;

        const books = await ReadFile("ListOfBooks.json", "books");
        books.push({ ...body, id: uuidv4()});
        await WriteFile("ListOfBooks.json", books);
        res.send({message: `cartea ${body.nume} a fost adaugata`});
    }catch(error){
        res.status(500).json({error: "Ceva nu a mers bine!"})
    }
};

export const getBook = async(req, res) => {
    try{
        if(!(await permissionUser(req) || await permissionLib(req))){
            return res.status(401).json({message: "Neautorizat!"})
        }
        if(!verifParamsIn(req)){                                                               
            return res.status(400).json({message: "Numele sau autorul este gresit!"})
        }
        if(!await searchBook(req)){
            return res.status(400).json({message: "Cartea nu exista!"})
        }

        const books = await ReadFile("ListOfBooks.json", "books");
        const foundBook = books.find(book => book.id === req.params.id);
        res.status(200).send(foundBook)
            
    }catch(error){
        res.status(403).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const deleteBook = async(req, res) => {
    try{
        if(!await permissionLib(req)){
            return res.status(401).json({message: "Neautorizat!"})
        }

        if(!verifParamsIn(req)){
            return res.status(400).json({message: "Numele sau autorul este gresit!"})
        }

        if(! await searchBook(req)){
            return res.status(400).json({message: "The book doesn t exist!"})
        }

        const books = await ReadFile("ListOfBooks.json", "books");   
        const booksR = books.filter(book => book.id !== req.params.id);
        await WriteFile("ListOfBooks.json", booksR);
        res.send({message: `Book:${req.params.id} was deleted`});

    }catch(error){
        res.status(404).json({eroor: "Ceva nu a mers bine!"})
    }
};
 
export const updateBook = async(req, res) => {
    try{
        if(!await permissionLib(req)){
            return res.status(401).json({message: "Neautorizat!"});
        }
        if(!verifParamsIn(req)){
            return res.status(400).json({message: "Numele sau autorul este gresit!"})
        }
        if(!await searchBook(req)){
            return res.status(400).json({message: "The book doesn t exist!"})
        }
        const verif = verifDataAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }

        const books = await ReadFile("ListOfBooks.json", "books");
        const foundBook = books.find(book => book.id === req.params.id)
        if(!foundBook){
            return res.status(401).json({message: `Cartea cu id ul ${req.params.id} nu exista!`})
        }
        foundBook.nume = req.body.nume;
        foundBook.autor = req.body.autor;
        await WriteFile("ListOfBooks.json", books);
        res.status(200).json({message: `Book: ${req.params.id} a fost modificata`})

    }catch(error){
        res.status(405).json({error: "Ceva nu a mers bine!"})
    }
};

export const borrowBook = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }
        if(!verifParamsIn(req)){
            return res.status(400).json({message: "Numele sau autorul este gresit!"})
        }
        const verif = verifDataAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }

        //update user
        if(typeof req.body.borrFrom !== 'string'){
            return res.status(400).json({message: 'Numele trebuie sa contina doar caractere!'})
        }
        let user = await searchUser(req.body.borrFrom);
        console.log(user);
        if(!user)
            return res.status(400).json({message: "User ul nu exista"})

        const users = await ReadFile("ListOfUsers.json", "users");
        user = users.find(user => user.username === req.body.borrFrom)
        await updateUser(user, 1);
        await fs.writeFile("ListOfUsers.json", JSON.stringify({users:users}))

        
        const books = await ReadFile("ListOfBooks.json", "books");
        const foundBook = books.find(book => book.nume === req.body.nume)
        if(!foundBook){
            return res.status(401).json({message: `Cartea nu exista!`})
        }
  
        if(foundBook.borrowedBook === true)
           return res.status(400).json({message: 'Cartea este deja imprumutata!'})

        // update carte
        foundBook.borrowedBook = true;
        foundBook.borrFrom = req.body.borrFrom;
        foundBook.dateBorr = new Date();
        const newDate = new Date();
        if(newDate.getMonth() < 7)
            newDate.setMonth(newDate.getMonth() + 6);
        else{
            newDate.setFullYear(newDate.getFullYear()+1);
            newDate.setMonth((6 - newDate.getMonth()) * -1 );
        }
        foundBook.dateRet = newDate;

        await WriteFile("ListOfBooks.json", books);
        res.status(200).json({message: "Imprumutata cu succes!"})
        
    }catch(error){
        console.log(error)
        res.status(500).json({eroor: "Ceva nu a mers bine!"})
    }
}

export const returnBook = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }
        if(!verifParamsIn(req)){
            return res.status(400).json({message: "Numele sau autorul este gresit!"})
        }
        const verif = verifDataAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }

        const books = await ReadFile("ListOfBooks.json", "books");
        const foundBook = books.find(book => book.nume === req.body.nume)
        if(!foundBook){
            return res.status(401).json({message: `Cartea cu id ul ${req.params.id} nu exista!`})
        }
        
        if(foundBook.borrowedBook === false)
           return res.status(400).json({message: 'Cartea nu este imprumutata pentru a o returna!'})


        // update carte
        foundBook.borrowedBook = false;
        delete foundBook.borrFrom;
        delete foundBook.dateBorr;
        delete foundBook.dateRet;

        //update user
        if(typeof req.body.borrFrom !== 'string'){
            return res.status(400).json({message: 'Numele trebuie sa contina doar caractere!'})
        }
        let user = await searchUser(req.body.borrFrom);
        console.log(user);
        if(!user)
            return res.status(400).json({message: "User ul nu exista"})

        const users = await ReadFile("ListOfUsers.json", "users");
        user = users.find(user => user.username === req.body.borrFrom)
        await updateUser(user, -1);
        await fs.writeFile("ListOfUsers.json", JSON.stringify({users:users}))

        await WriteFile("ListOfBooks.json", books);
        res.status(200).json({message: "Returnata cu succes!"})
 
    }catch(error){
        res.status(407).json({eroor: "Ceva nu a mers bine!"})
    }
}