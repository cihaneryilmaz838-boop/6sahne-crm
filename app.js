const express = require('express');
const session = require('express-session');

const db = require('./core/db');
const { hashPassword, verifyPassword } = require('./core/password');
const { writeAuditLog } = require('./core/audit');
const { ROLES, attachCurrentUser, requireAuth, requireRole } = require('./core/auth');
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

const findActiveUserByUsernameStmt = db.prepare(`
  SELECT id, username, role, password_hash, password_salt
  FROM users
  WHERE username = ? AND is_active = 1
  LIMIT 1
`);

const findUserCredentialsByIdStmt = db.prepare(`
  SELECT id, password_hash, password_salt
  FROM users
  WHERE id = ? AND is_active = 1
  LIMIT 1
`);

const updateUserPasswordStmt = db.prepare(`
  UPDATE users
  SET password_hash = @password_hash,
      password_salt = @password_salt
  WHERE id = @id
`);

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
app.use(attachCurrentUser);
app.use(requireCsrf);

app.get('/login', (req, res) => {
  if (req.session && req.session.user) {
    return res.redirect('/reports');
  }

  return res.render('login', {
    title: 'Login',
    error: null,
    form: { username: '' },
  });
});

app.post('/login', (req, res) => {
  const username = String(req.body.username || '').trim();
  const password = String(req.body.password || '');

  if (!username || !password) {
    return res.status(422).render('login', {
      title: 'Login',
      error: 'Invalid username or password.',
      form: { username },
    });
  }

  const user = findActiveUserByUsernameStmt.get(username);
  const validUser = user
    && user.password_hash
    && user.password_salt
    && verifyPassword(password, user.password_salt, user.password_hash);

  if (!validUser) {
    return res.status(401).render('login', {
      title: 'Login',
      error: 'Invalid username or password.',
      form: { username },
    });
  }

  req.session.user = {
    id: user.id,
    username: user.username,
    role: String(user.role || '').toUpperCase(),
  };

  return res.redirect('/reports');
});

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
    return res.redirect('/login');
  });
});

app.get('/account/password', requireAuth, (req, res) => {
  return res.render('account/password', {
    title: 'Change Password',
    errors: [],
    successMessage: null,
  });
});

app.post('/account/password', requireAuth, (req, res) => {
  const currentPassword = String(req.body.current_password || '');
  const newPassword = String(req.body.new_password || '');
  const confirmNewPassword = String(req.body.confirm_new_password || '');
  const errors = [];

  if (!currentPassword) {
    errors.push('Current password is required.');
  }
  if (!newPassword) {
    errors.push('New password is required.');
  }
  if (newPassword.length < 8) {
    errors.push('New password must be at least 8 characters.');
  }
  if (newPassword !== confirmNewPassword) {
    errors.push('New password and confirmation do not match.');
  }

  const user = findUserCredentialsByIdStmt.get(req.user.id);
  if (!user || !verifyPassword(currentPassword, user.password_salt, user.password_hash)) {
    errors.push('Current password is incorrect.');
  }

  if (errors.length > 0) {
    return res.status(422).render('account/password', {
      title: 'Change Password',
      errors,
      successMessage: null,
    });
  }

  const nextPassword = hashPassword(newPassword);
  updateUserPasswordStmt.run({
    id: req.user.id,
    password_hash: nextPassword.hash,
    password_salt: nextPassword.salt,
  });

  writeAuditLog({
    actionType: 'UPDATE',
    actorUserId: req.user.id,
    entityType: 'user',
    entityId: req.user.id,
    reason: 'password_change',
  });

  return res.render('account/password', {
    title: 'Change Password',
    errors: [],
    successMessage: 'Password updated successfully.',
  });
});

app.get('/', (req, res) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }

  return res.redirect('/reports');
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
