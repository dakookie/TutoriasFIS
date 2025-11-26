const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI);

        console.log(`✅ MongoDB Conectado: ${conn.connection.host}`);
        console.log(`📊 Base de datos: ${conn.connection.name}`);
    } catch (error) {
        console.error(`❌ Error al conectar MongoDB: ${error.message}`);
        process.exit(1);
    }
};

module.exports = connectDB;
