const { db } = require('../db');

const insertAuditStmt = db.prepare(`
  INSERT INTO audit_log (
    action_type,
    actor_user_id,
    entity_type,
    entity_id,
    reason,
    payload_json
  ) VALUES (
    @action_type,
    @actor_user_id,
    @entity_type,
    @entity_id,
    @reason,
    @payload_json
  )
`);

function logAudit({ actionType, actorUserId = null, entityType, entityId = null, reason = null, payload = null }) {
  insertAuditStmt.run({
    action_type: actionType,
    actor_user_id: actorUserId,
    entity_type: entityType,
    entity_id: entityId,
    reason,
    payload_json: payload ? JSON.stringify(payload) : null,
  });
}

module.exports = {
  logAudit,
};
