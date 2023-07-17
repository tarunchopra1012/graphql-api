// db.js
const { MongoClient } = require('mongodb');

const dbName = 'eshop';
const url = 'mongodb://localhost:27017';

let db;

async function connectDB() {
  try {
    const client = await MongoClient.connect(url);
    db = client.db(dbName);
    console.log('Connected successfully to the database!');
  } catch (error) {
    console.error('Failed to connect to the database:', error);
  }
}

function getDB() {
  return db;
}

module.exports = {
  connectDB,
  getDB,
};
