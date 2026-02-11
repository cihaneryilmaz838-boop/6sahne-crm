const repo = require('./repo');
const { writeAuditLog } = require('../../core/audit');

const DIRECTION_VALUES = ['IN', 'OUT'];
const PAYMENT_METHOD_VALUES = ['CASH', 'TRANSFER', 'CARD'];

function normalizeCreatePayload(body, currentUser) {
  const payload = {
    direction: String(body.direction || '').toUpperCase(),
    amount: Number(body.amount),
    currency: String(body.currency || 'TRY').toUpperCase(),
    date: String(body.date || ''),
    category_id: Number(body.category_id),
    payment_method: String(body.payment_method || '').toUpperCase(),
    note: body.note ? String(body.note).trim() : null,
    ref_type: body.ref_type ? String(body.ref_type).trim() : null,
    ref_id: body.ref_id ? Number(body.ref_id) : null,
    created_by: currentUser.id,
    updated_by: currentUser.id,
  };

  const errors = [];

  if (!DIRECTION_VALUES.includes(payload.direction)) {
    errors.push('Direction must be IN or OUT.');
  }

  if (!Number.isInteger(payload.amount) || payload.amount <= 0) {
    errors.push('Amount must be a positive integer (kuruş).');
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(payload.date)) {
    errors.push('Date must be in YYYY-MM-DD format.');
  }

  if (!Number.isInteger(payload.category_id)) {
    errors.push('Category is required.');
  } else {
    const category = repo.getCategoryById(payload.category_id);
    if (!category || !category.is_active) {
      errors.push('Selected category is not active.');
    } else if (category.direction !== payload.direction) {
      errors.push('Category direction must match transaction direction.');
    }
  }

  if (!PAYMENT_METHOD_VALUES.includes(payload.payment_method)) {
    errors.push('Payment method must be CASH, TRANSFER, or CARD.');
  }

  return { payload, errors };
}

function createTransaction(body, currentUser) {
  const { payload, errors } = normalizeCreatePayload(body, currentUser);

  if (errors.length > 0) {
    return { errors };
  }

  const id = repo.createTransaction(payload);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'finance_tx',
    entityId: id,
    payload,
  });

  return { id };
}

function cancelTransaction(id, cancelReason, currentUser) {
  const reason = String(cancelReason || '').trim();
  if (!reason) {
    return { errors: ['Cancel reason is required.'] };
  }

  const tx = repo.getTransactionById(id);
  if (!tx) {
    return { errors: ['Transaction not found.'] };
  }

  if (tx.is_cancelled) {
    return { errors: ['Transaction is already cancelled.'] };
  }

  const result = repo.cancelTransaction(id, { cancelled_by: currentUser.id, cancel_reason: reason });

  if (result.changes === 0) {
    return { errors: ['Unable to cancel transaction.'] };
  }

  writeAuditLog({
    actionType: 'CANCEL',
    actorUserId: currentUser.id,
    entityType: 'finance_tx',
    entityId: Number(id),
    reason,
    payload: { before: tx },
  });

  return { success: true };
}

function createCategory(body, currentUser) {
  const payload = {
    name: String(body.name || '').trim(),
    direction: String(body.direction || '').toUpperCase(),
    parent_id: body.parent_id ? Number(body.parent_id) : null,
  };

  const errors = [];
  if (!payload.name) {
    errors.push('Category name is required.');
  }
  if (!DIRECTION_VALUES.includes(payload.direction)) {
    errors.push('Direction must be IN or OUT.');
  }
  if (payload.parent_id) {
    const parent = repo.getCategoryById(payload.parent_id);
    if (!parent) {
      errors.push('Parent category was not found.');
    } else if (parent.direction !== payload.direction) {
      errors.push('Parent category direction must match child direction.');
    }
  }

  if (errors.length > 0) {
    return { errors };
  }

  const id = repo.createCategory(payload);

  writeAuditLog({
    actionType: 'CREATE',
    actorUserId: currentUser.id,
    entityType: 'category',
    entityId: id,
    payload,
  });

  return { id };
}

module.exports = {
  DIRECTION_VALUES,
  PAYMENT_METHOD_VALUES,
  createTransaction,
  cancelTransaction,
  createCategory,
};
