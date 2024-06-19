//REST API 
import http from 'http'
import express from 'express';                          // importam modulul express  
import bodyParser from 'body-parser';                   //  importam modulul body-parser pentru a putea lucra cu req
import persoaneRoutes from './routes/persoane.js';
import cartiRoutes from './routes/carti.js';
import connectDB from "./config/dbConn.js"
import mongoose from 'mongoose';
// app
const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/persoane', persoaneRoutes);
app.use('/carti', cartiRoutes);

const PORT = process.env.PORT || 8080;
const uri = "mongodb+srv://mateipartac45:Lucaaliuta13$@cluster0.stmiw0l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Connect to MongoDB
connectDB();
console.log(34);
// Create server 
const server = http.createServer(app);
mongoose.connection.once('open', () => {
    console.log('Connected to MongoDB');
    // Connect to server
    server.listen( PORT , (err) => {
        if (err) {
            console.log("Not connected to server: ", err);
        }
        console.log(`Server running on port: http://localhost:${PORT}`)
    })
})



