// usersController.js
const { getDB } = require('../config/db');

async function getUsers(req, res) {
  try {
    const db = getDB();
    const users = await db.collection('users').find({}).toArray();
    console.log(users);
    res.send(users);
  } catch (error) {
    console.error('Failed to fetch users:', error);
    res.status(500).send('Internal Server Error');
  }
}

module.exports = {
  getUsers,
};
