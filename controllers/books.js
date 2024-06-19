/*
middlewere
codurile de status

*/
// interogari cu matrice
import mongodb from "mongodb"
import { MongoClient } from "mongodb";
import Book from "../model/books.js"

const uri = "mongodb+srv://mateipartac45:Lucaaliuta13$@cluster0.stmiw0l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
const client = new MongoClient(uri);
const collectionBooks = client.db("biblioteca").collection("books");
const collectionUsers = client.db("biblioteca").collection("users");
const { ObjectId } = mongodb;


async function permissionLib(req){
    try{
        return await collectionUsers.findOne({_id: new ObjectId(`${req.headers.idlib}`)})  // header ul converteste in litere mici
    }catch(err){
        return false;
    }
}

async function permissionUser(req){
    try{
        return await collectionUsers.findOne({_id: new ObjectId(`${req.headers.iduser}`)})
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
    try{
        return await collectionBooks.findOne({_id: new ObjectId(`${req.params.id}`)})
    }catch(err){
        return false;
    }
}

export const listOfBooks = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }

        //const carti = await ReadFile();
        const carti = await collectionBooks.find({}).maxTimeMS(50).toArray((err, data) => {
            if (err) {
                res.status(400).json({error: 'Eroare la interogarea cartilor!'})
            }
            return res.json(data);
        });

        res.send({carti})
    }catch(error){
        res.status(401).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const listOfBooksAvailable = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }
        
        const books = await collectionBooks.find({borrowedBook: false}).maxTimeMS(50).toArray((err, data) => {
            if (err) {
                res.status(400).json({error: 'Eroare!'})
            }
            return res.json(data);
        });

        res.send({books})

    }catch(error){
        res.status(401).json({eroor: "Ceva nu a mers bine!"})
    }
};

export const listOfBooksBorr = async(req, res) => {
    try{
        if(!(await permissionLib(req) || await permissionUser(req))){
            return res.status(401).json({message: "Neautorizat!"});
        }
        
        const borrowedBooks = await collectionBooks.find({borrowedBook: true}).maxTimeMS(50).toArray((err, data) => {
            if (err) {
                res.status(400).json({error: 'Eroare!'})
            }
            return res.json(data);
        });

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
        const book = new Book(body);
        book.save();

        await collectionBooks.insertOne(book);
        res.send({message: `cartea ${book.nume} a fost adaugata`});
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

        const foundBook = await collectionBooks.findOne({_id: new ObjectId(`${req.params.id}`)})
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

        await collectionBooks.deleteOne({_id: new ObjectId(`${req.params.id}`)});
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
        if(! await searchBook(req)){
            return res.status(400).json({message: "The book doesn t exist!"})
        }
        const verif = verifDataAdd(req);
        if(verif !== true){
            return res.status(400).json({message: verif})
        }

        await collectionBooks.updateOne(
            {_id: new ObjectId(`${req.params.id}`)}, 
            {$set: new Object(req.body)}, 
            {upsert: true}
        )
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
        if(typeof req.body.borrFrom !== 'string'){
            return res.status(400).json({message: 'Numele trebuie sa contina doar caractere!'})
        }
        
        const foundBook = await collectionBooks.findOne({nume: `${req.body.nume}`})

        if(!foundBook){
            return res.status(400).json({message: "Cartea nu exista!"})
        }
  
        if(foundBook.impCarte === true)
           return res.status(400).json({message: 'Cartea este deja imprumutata!'})
        // update carte
        foundBook.borrowedBook = true;
        foundBook.borrFrom = req.body.borrFrom;
        foundBook.dateBorr = new Date();

        //update user
        collectionUsers.updateOne({username: req.body.borrFrom}, {$inc: {booksNumberBorrowed: 1, booksToReturn: 1}})

        const newDate = new Date();
        if(newDate.getMonth() < 7)
            newDate.setMonth(newDate.getMonth() + 6);
        else{
            newDate.setFullYear(newDate.getFullYear()+1);
            newDate.setMonth((6 - newDate.getMonth()) * -1 );
        }
        foundBook.dateRet = newDate;

        await collectionBooks.updateOne(
            {nume: `${req.body.nume}`}, 
            {$set: new Object(foundBook)}
        )
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

        const foundBook = await collectionBooks.findOne({nume: `${req.body.nume}`})
        if(!foundBook){
            return res.status(400).json({message: "Cartea nu exista!"})
        }
        
        if(foundBook.borrowedBook === false)
           return res.status(400).json({message: 'Cartea nu este imprumutata pentru a o returna!'})

        // update user
        collectionUsers.updateOne({username: foundBook.borrFrom}, {$inc: {booksToReturn: -1}})

        // update carte
        foundBook.borrowedBook = false;
        await collectionBooks.updateOne(
            {nume: `${req.body.nume}`}, 
            {$set: {borrowedBook: false}}, 
        )
        await collectionBooks.updateOne(
            {nume: `${req.body.nume}`}, 
            {$unset: { borrFrom: "", dateRet: "", dateBorr: ""} }
        )
        res.status(200).json({message: "Returnata cu succes!"})
 
    }catch(error){
        res.status(407).json({eroor: "Ceva nu a mers bine!"})
    }
}