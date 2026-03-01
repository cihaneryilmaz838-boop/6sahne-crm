const express = require('express');
const session = require('express-session');

require('./core/db');
const { ROLES, requireAuth, requireRole } = require('./core/auth');
const { attachCsrfToken, requireCsrf } = require('./core/csrf');
const { errorHandler, notFoundHandler } = require('./core/errors');

const financeRoutes = require('./modules/finance/routes');
const studentsRoutes = require('./modules/students/routes');
const booksRoutes = require('./modules/books/routes');
const inventoryRoutes = require('./modules/inventory/routes');
const salesRoutes = require('./modules/sales/routes');
const reportsRoutes = require('./modules/reports/routes');

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET is required in production. Please set a strong SESSION_SECRET environment variable.');
}

app.set('view engine', 'ejs');
app.set('views', require('path').join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

if (isProduction) {
  app.set('trust proxy', 1);
}

app.use(
  session({
    name: 'crm.sid',
    secret: process.env.SESSION_SECRET || 'change-this-in-development',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

app.use(attachCsrfToken);

app.use((req, res, next) => {
  res.locals.currentUser = (req.session && req.session.user) || null;
  next();
});

app.use(requireCsrf);

// Temporary login helper for skeleton phase only.
app.get('/login-as/:role', (req, res) => {
  if (isProduction) {
    return res.status(404).send('Not Found');
  }

  const inputRole = String(req.params.role || '').toUpperCase();
  if (!Object.values(ROLES).includes(inputRole)) {
    return res.status(400).send('Invalid role. Use PATRON, STAFF or ADMIN.');
  }

  req.session.user = {
    id: 1,
    username: `${inputRole.toLowerCase()}-demo`,
    role: inputRole,
  };

  return res.send(`Logged in as ${inputRole}`);
});

app.post('/logout', requireAuth, (req, res, next) => {
  req.session.destroy((err) => {
    if (err) {
      return next(err);
    }
    res.clearCookie('crm.sid');
    return res.send('Logged out');
  });
});

app.get('/', (req, res) => {
  res.send('6Sahne CRM skeleton is running.');
});

// Module route loader + role guards.
app.use('/finance', requireAuth, requireRole(ROLES.STAFF, ROLES.ADMIN), financeRoutes);
app.use('/students', requireAuth, requireRole(ROLES.STAFF, ROLES.ADMIN), studentsRoutes);
app.use('/books', requireAuth, requireRole(ROLES.STAFF, ROLES.ADMIN), booksRoutes);
app.use('/inventory', requireAuth, requireRole(ROLES.STAFF, ROLES.ADMIN), inventoryRoutes);
app.use('/sales', requireAuth, requireRole(ROLES.STAFF, ROLES.ADMIN), salesRoutes);
app.use('/reports', requireAuth, requireRole(ROLES.PATRON, ROLES.STAFF, ROLES.ADMIN), reportsRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`6Sahne CRM listening on http://localhost:${PORT}`);
});
