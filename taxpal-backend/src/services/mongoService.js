const mongoose = require('mongoose');

const getCollection = (name) => {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection is not ready');
  }

  return mongoose.connection.db.collection(name);
};

module.exports = {
  getCollection
};