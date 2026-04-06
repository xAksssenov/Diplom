import { Notification, Portal, Stack } from '@mantine/core'
import { useUnit } from 'effector-react'
import { $notifications, notificationRemoved } from '../../model/notifications'

export function AppNotifications() {
  const { notifications, remove } = useUnit({
    notifications: $notifications,
    remove: notificationRemoved,
  })

  return (
    <Portal>
      <Stack
        gap="xs"
        style={{
          position: 'fixed',
          top: 16,
          right: 16,
          zIndex: 1000,
          width: 360,
          maxWidth: 'calc(100vw - 32px)',
        }}
      >
        {notifications.map((notification) => (
          <Notification
            key={notification.id}
            color={notification.color}
            title={notification.title}
            withCloseButton
            onClose={() => remove(notification.id)}
          >
            <div>{notification.message}</div>
          </Notification>
        ))}
      </Stack>
    </Portal>
  )
}
