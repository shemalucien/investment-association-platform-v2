import { query } from "../connection"
import type { Notification } from "@/lib/types"

export async function getNotificationsForMember(memberId: string): Promise<Notification[]> {
  try {
    const result = await query<any>(
      `
      SELECT id, member_id, title, message, notification_type, is_read, related_entity_type, related_entity_id,
             attachment_name, attachment_type, attachment_data, created_at
      FROM notifications
      WHERE member_id = $1
      ORDER BY created_at DESC
    `,
      [memberId],
    )

    return result.rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      title: row.title,
      message: row.message,
      type: row.notification_type as "info" | "success" | "warning" | "alert",
      read: row.is_read,
      relatedEntityType: row.related_entity_type ?? undefined,
      relatedEntityId: row.related_entity_id ?? undefined,
      attachmentName: row.attachment_name ?? undefined,
      attachmentType: row.attachment_type ?? undefined,
      attachmentData: row.attachment_data ?? undefined,
      createdAt: row.created_at,
    }))
  } catch (error) {
    const result = await query<any>(
      `
      SELECT id, member_id, title, message, notification_type, is_read, related_entity_type, related_entity_id, created_at
      FROM notifications
      WHERE member_id = $1
      ORDER BY created_at DESC
    `,
      [memberId],
    )

    return result.rows.map((row) => ({
      id: row.id,
      memberId: row.member_id,
      title: row.title,
      message: row.message,
      type: row.notification_type as "info" | "success" | "warning" | "alert",
      read: row.is_read,
      relatedEntityType: row.related_entity_type ?? undefined,
      relatedEntityId: row.related_entity_id ?? undefined,
      createdAt: row.created_at,
    }))
  }
}

export async function createNotificationForMember(
  memberId: string,
  title: string,
  message: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  notificationType: string = "info",
  attachmentName?: string,
  attachmentType?: string,
  attachmentData?: string,
): Promise<Notification> {
  // related_entity_id is UUID type in DB — only pass it if it looks like a valid UUID
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  const safeRelatedEntityId =
    relatedEntityId && uuidRegex.test(relatedEntityId) ? relatedEntityId : null

  let result
  try {
    result = await query<any>(
      `
      INSERT INTO notifications (
        member_id,
        title,
        message,
        notification_type,
        related_entity_type,
        related_entity_id,
        attachment_name,
        attachment_type,
        attachment_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `,
      [memberId, title, message, notificationType, relatedEntityType || null, safeRelatedEntityId, attachmentName || null, attachmentType || null, attachmentData || null],
    )
  } catch (error) {
    result = await query<any>(
      `
      INSERT INTO notifications (
        member_id,
        title,
        message,
        notification_type,
        related_entity_type,
        related_entity_id
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `,
      [memberId, title, message, notificationType, relatedEntityType || null, safeRelatedEntityId],
    )
  }

  const row = result.rows[0]
  return {
    id: row.id,
    memberId: row.member_id,
    title: row.title,
    message: row.message,
    type: row.notification_type as "info" | "success" | "warning" | "alert",
    read: row.is_read,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    attachmentName: row.attachment_name ?? undefined,
    attachmentType: row.attachment_type ?? undefined,
    attachmentData: row.attachment_data ?? undefined,
    createdAt: row.created_at,
  }
}

export async function markNotificationAsRead(
  notificationId: string,
  memberId: string,
): Promise<Notification | null> {
  const result = await query<any>(
    `
    UPDATE notifications
    SET is_read = true
    WHERE id = $1
    RETURNING *
  `,
    [notificationId],
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    memberId: row.member_id,
    title: row.title,
    message: row.message,
    type: row.notification_type as "info" | "success" | "warning" | "alert",
    read: row.is_read,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    createdAt: row.created_at,
  }
}

export async function markNotificationAsUnread(
  notificationId: string,
  memberId: string,
): Promise<Notification | null> {
  const result = await query<any>(
    `
    UPDATE notifications
    SET is_read = false
    WHERE id = $1
    RETURNING *
  `,
    [notificationId],
  )

  if (result.rows.length === 0) {
    return null
  }

  const row = result.rows[0]
  return {
    id: row.id,
    memberId: row.member_id,
    title: row.title,
    message: row.message,
    type: row.notification_type as "info" | "success" | "warning" | "alert",
    read: row.is_read,
    relatedEntityType: row.related_entity_type ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
    createdAt: row.created_at,
  }
}
