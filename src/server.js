require('dotenv').config();
const app = require('./app');
app.listen(process.env.PORT, () => {
  console.log(`FaithStream backend running on ${process.env.PORT}`);
});
