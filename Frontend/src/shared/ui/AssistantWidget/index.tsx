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

const normalizeAssistantText = (content: string) =>
  content
    .replace(/\r\n/g, '\n')
    .replace(/\s(\d+\.\s\*\*)/g, '\n\n$1')
    .replace(/\s\*\s(?=\*\*|[A-Za-zА-Яа-яЁё0-9])/g, '\n• ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

const renderMessageContent = (message: ChatMessage) => {
  const content =
    message.role === 'assistant' ? normalizeAssistantText(message.content) : message.content
  const parts = content.split(/(\*\*[^*]+\*\*)/g)

  return (
    <Text size="sm" style={{ whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>
      {parts.map((part, index) => {
        const isBold = part.startsWith('**') && part.endsWith('**') && part.length > 4
        if (!isBold) return <span key={`${part}-${index}`}>{part}</span>

        return (
          <Text key={`${part}-${index}`} component="span" fw={700}>
            {part.slice(2, -2)}
          </Text>
        )
      })}
    </Text>
  )
}

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
      {!opened ? (
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
      ) : null}

      <Drawer
        opened={opened}
        onClose={() => setOpened(false)}
        position="right"
        title="AI ассистент по рациону"
        size={420}
        styles={{
          body: {
            display: 'flex',
            flexDirection: 'column',
            height: '95%',
            overflow: 'hidden',
          },
        }}
      >
        <Stack
          gap="sm"
          style={{ flex: 1, minHeight: 0 }}
        >
          <ScrollArea style={{ flex: 1, minHeight: 0 }}>
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
                  {renderMessageContent(message)}
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
              marginTop: 'auto',
              background: 'white',
              paddingTop: 8,
              paddingBottom: 12,
            }}
          >
            <Textarea
              value={input}
              onChange={(event) => setInput(event.currentTarget.value)}
              placeholder="Спросите, что добавить в рацион..."
              minRows={4}
              autosize
              maxRows={8}
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
