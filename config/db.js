require('dotenv').config();

module.exports = {
  url: process.env.MONGODB_URI || 'mongodb://localhost:27017/si-anjem',
  options: {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
};