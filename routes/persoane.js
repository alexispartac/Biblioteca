import express from 'express'; 
import {listOfUsers, addUser, getUser, deleteUser, updateUser} from '../controllers/users.js'

const router = express.Router()              //cream o ruta

// Obținere lista de persoane
router.get( '/' , listOfUsers);

// Adaugare persoana
router.post('/', addUser)

// Oține un singur utilizator prin id 
router.get( '/:id' , getUser)

//Stergere persoana prin id
router.delete('/:id', deleteUser)

//Modificare user
router.patch('/:id', updateUser)


export default router;