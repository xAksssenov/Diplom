import { ActionIcon, Button, Drawer, Loader, ScrollArea, Stack, Text, Textarea } from '@mantine/core'
import { useState } from 'react'
import { askAssistant } from '../../api/foodApi'
import { pushApiError } from '../../model/notifications'

type ChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

const initialMessages: ChatMessage[] = [
  {
    role: 'assistant',
    content:
      'Привет! Я AI-помощник FoodPlanner. Могу подсказать, что добавить в рацион или как улучшить меню на день.',
  },
]

export function AssistantWidget() {
  const [opened, setOpened] = useState(false)
  const [input, setInput] = useState('')
  const [pending, setPending] = useState(false)
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)

  const sendMessage = async () => {
    const text = input.trim()
    if (!text || pending) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: text }]
    setMessages(nextMessages)
    setInput('')
    setPending(true)
    try {
      const reply = await askAssistant(
        nextMessages
          .filter((item) => item.role === 'user' || item.role === 'assistant')
          .map((item) => ({ role: item.role, content: item.content })),
      )
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }])
    } catch (error) {
      pushApiError(error, 'Не удалось получить ответ ассистента.')
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Сейчас не получилось ответить. Попробуйте еще раз чуть позже.' },
      ])
    } finally {
      setPending(false)
    }
  }

  return (
    <>
      <ActionIcon
        size={56}
        radius="xl"
        color="grape"
        variant="filled"
        onClick={() => setOpened(true)}
        style={{
          position: 'fixed',
          right: 20,
          bottom: 20,
          zIndex: 1100,
          boxShadow: '0 10px 28px rgba(95, 54, 170, 0.35)',
        }}
        aria-label="Открыть AI ассистента"
      >
        <Text c="white" fw={700}>
          AI
        </Text>
      </ActionIcon>

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="right"
        title="AI ассистент по рациону"
        size={420}
      >
        <Stack
          gap="sm"
          style={{ height: 'calc(100vh - 130px)', minHeight: 420 }}
        >
          <ScrollArea style={{ flex: 1 }}>
            <Stack gap="xs" pr={6}>
              {messages.map((message, index) => (
                <Stack
                  key={`${message.role}-${index}`}
                  gap={4}
                  p="sm"
                  style={{
                    borderRadius: 10,
                    background:
                      message.role === 'assistant'
                        ? 'rgba(167, 139, 250, 0.14)'
                        : 'rgba(91, 42, 138, 0.12)',
                  }}
                >
                  <Text size="xs" c="dimmed">
                    {message.role === 'assistant' ? 'Ассистент' : 'Вы'}
                  </Text>
                  <Text size="sm">{message.content}</Text>
                </Stack>
              ))}
              {pending ? (
                <Stack
                  gap={6}
                  p="sm"
                  style={{ borderRadius: 10, background: 'rgba(167, 139, 250, 0.14)' }}
                >
                  <Text size="xs" c="dimmed">
                    Ассистент
                  </Text>
                  <Loader size="xs" color="grape" />
                </Stack>
              ) : null}
            </Stack>
          </ScrollArea>

          <Stack
            gap="xs"
            style={{
              position: 'sticky',
              bottom: 0,
              background: 'white',
              paddingTop: 8,
            }}
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Спросите, что добавить в рацион..."
              minRows={2}
              autosize
              maxRows={5}
            />
            <Button color="grape" onClick={sendMessage} loading={pending}>
              Отправить
            </Button>
          </Stack>
        </Stack>
      </Drawer>
    </>
  )
}
