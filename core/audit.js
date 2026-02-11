const db = require('./db');

function writeAuditLog({ actionType, actorUserId, entityType, entityId, reason = null, payload = null }) {
  db.prepare(
    `INSERT INTO audit_log (action_type, actor_user_id, entity_type, entity_id, reason, payload_json)
     VALUES (?, ?, ?, ?, ?, ?)`
  ).run(
    actionType,
    actorUserId || null,
    entityType,
    entityId || null,
    reason,
    payload ? JSON.stringify(payload) : null
  );
}

module.exports = { writeAuditLog };
