const express = require('express');
const service = require('./service');

const router = express.Router();

function defaultCreateForm() {
  return {
    username: '',
    role: 'STAFF',
    is_active: 1,
  };
}

router.get('/', (req, res) => {
  const users = service.listUsers();

  return res.render('admin/users/index', {
    title: 'Users',
    users,
  });
});

router.get('/new', (req, res) => {
  return res.render('admin/users/new', {
    title: 'Create User',
    form: defaultCreateForm(),
    errors: [],
    roles: service.ALLOWED_ROLES,
  });
});

router.post('/', (req, res) => {
  const result = service.createUser(req.body, req.user);

  if (result.errors) {
    return res.status(422).render('admin/users/new', {
      title: 'Create User',
      form: {
        username: String(req.body.username || '').trim(),
        role: String(req.body.role || 'STAFF').toUpperCase(),
        is_active: req.body.is_active ? 1 : 0,
      },
      errors: result.errors,
      roles: service.ALLOWED_ROLES,
    });
  }

  req.session.flash = { type: 'success', message: 'User created successfully.' };
  return res.redirect('/admin/users');
});

router.get('/:id', (req, res) => {
  const userId = Number(req.params.id);
  const user = service.getUserById(userId);

  if (!user) {
    return res.status(404).send('User not found');
  }

  return res.render('admin/users/detail', {
    title: `User #${user.id}`,
    user,
    roles: service.ALLOWED_ROLES,
    errors: [],
    successMessage: null,
    updateForm: {
      role: user.role,
      is_active: user.is_active,
    },
    resetForm: {
      new_password: '',
      confirm_new_password: '',
    },
  });
});

router.post('/:id', (req, res) => {
  const userId = Number(req.params.id);
  const result = service.updateUser(userId, req.body, req.user);

  if (result.notFound) {
    return res.status(404).send('User not found');
  }

  if (result.errors) {
    const user = service.getUserById(userId);
    return res.status(422).render('admin/users/detail', {
      title: `User #${userId}`,
      user,
      roles: service.ALLOWED_ROLES,
      errors: result.errors,
      successMessage: null,
      updateForm: {
        role: String(req.body.role || '').toUpperCase(),
        is_active: req.body.is_active ? 1 : 0,
      },
      resetForm: {
        new_password: '',
        confirm_new_password: '',
      },
    });
  }

  if (Number(req.user.id) === userId) {
    req.session.user.role = String(req.body.role || '').toUpperCase();
  }

  req.session.flash = { type: 'success', message: 'User updated successfully.' };
  return res.redirect(`/admin/users/${userId}`);
});

router.post('/:id/reset-password', (req, res) => {
  const userId = Number(req.params.id);
  const result = service.resetPassword(userId, req.body, req.user);

  if (result.notFound) {
    return res.status(404).send('User not found');
  }

  if (result.errors) {
    const user = service.getUserById(userId);
    return res.status(422).render('admin/users/detail', {
      title: `User #${userId}`,
      user,
      roles: service.ALLOWED_ROLES,
      errors: result.errors,
      successMessage: null,
      updateForm: {
        role: user.role,
        is_active: user.is_active,
      },
      resetForm: {
        new_password: '',
        confirm_new_password: '',
      },
    });
  }

  req.session.flash = { type: 'success', message: 'Password reset successfully.' };
  return res.redirect(`/admin/users/${userId}`);
});

module.exports = router;
