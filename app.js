const path = require('path');
const express = require('express');
require('./core/db');

const { attachCurrentUser } = require('./core/auth');
const financeRoutes = require('./modules/finance/routes');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: false }));
app.use(attachCurrentUser);

app.get('/', (req, res) => {
  return res.render('home', { title: '6Sahne CRM' });
});

app.use('/finance', financeRoutes);

app.use((req, res) => {
  res.status(404).send('<h1>404</h1>');
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Server started on http://localhost:${port}`);
});
