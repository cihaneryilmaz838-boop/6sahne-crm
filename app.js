const express = require('express');
const session = require('express-session');

require('./db');
const { ROLES, requireAuth, requireRole } = require('./core/auth');
const { errorHandler, notFoundHandler } = require('./core/errors');

const financeRoutes = require('./modules/finance/routes');
const studentsRoutes = require('./modules/students/routes');
const booksRoutes = require('./modules/books/routes');
const inventoryRoutes = require('./modules/inventory/routes');
const salesRoutes = require('./modules/sales/routes');
const reportsRoutes = require('./modules/reports/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(
  session({
    name: 'crm.sid',
    secret: process.env.SESSION_SECRET || 'change-this-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 8,
    },
  })
);

// Temporary login helper for skeleton phase only.
app.get('/login-as/:role', (req, res) => {
  const role = req.params.role;
  if (!Object.values(ROLES).includes(role)) {
    return res.status(400).send('Invalid role. Use Patron, Staff or Admin.');
  }

  req.session.user = {
    id: 1,
    username: `${role.toLowerCase()}-demo`,
    role,
  };

  return res.send(`Logged in as ${role}`);
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
