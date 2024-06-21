
import mongoose from "mongoose";
const Schema = mongoose.Schema;

const carteSchema = new Schema({
    nume: {
        type: String,
        description: 'Name of the book.',
        required: true
    },
    autor: {
        type: String,
        description: 'Author of the book.',
        required: true
    },
    borrowedBook: {
        type: Boolean,
        description: 'Status.',
        required: true
    },
    borrFrom:{ 
        type: String,
        description: 'The person who borrowed the book.'
    },
    dateBorr: {
        type: Date,
        description: 'Date of borrow.'

    },
    dateRet: {
        type: Date,
        description: 'Date of return.'
    }
});

export default mongoose.model('Book', carteSchema);
