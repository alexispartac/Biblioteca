import mongoose from "mongoose";

const URI ="mongodb+srv://mateipartac45:Lucaaliuta13$@cluster0.stmiw0l.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

export default async function connectDB(){
    try{
        await mongoose.connect(URI);
    }catch(err){
        console.log(err);
    }
}



