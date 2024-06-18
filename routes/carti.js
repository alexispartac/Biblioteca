import express from 'express'; 
import {listOfBooks, addBook, getBook, deleteBook, updateBook, borrowBook, returnBook, listOfBooksBorr, listOfBooksAvailable} from '../controllers/books.js'


const router = express.Router()              //cream o ruta

// Obținere lista de carti
router.get( '/' , listOfBooks);

// Lista carti imprummutate
router.get( '/imprumutate', listOfBooksBorr);

// Lista carti disponibile
router.get( '/disponibile', listOfBooksAvailable);

// Adaugare carte
router.post('/', addBook)

// Oține o singura carte prin id 
router.get( '/carte/:id' , getBook)

//Stergere carte prin id
router.delete('/:id', deleteBook)

//Modificare carte
router.patch('/carte/:id', updateBook)

// //Imprumuta carte
router.patch('/imprumuta', borrowBook)

// //Returnare carte
router.patch('/returnare', returnBook)

export default router;