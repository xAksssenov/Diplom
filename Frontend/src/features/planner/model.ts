import { createEvent, createStore } from 'effector'

type SlotsMap = Record<string, string>

export const daysCountChanged = createEvent<number>()
export const snacksCountChanged = createEvent<number>()
export const recipeAssignedToSlot = createEvent<{ slotKey: string; recipeId: string }>()
export const slotsSwapped = createEvent<{ sourceSlot: string; targetSlot: string }>()
export const slotCleared = createEvent<string>()
export const plannerErrorSet = createEvent<string>()
export const plannerSubmitMessageSet = createEvent<string>()
export const plannerMessagesReset = createEvent()

export const $daysCount = createStore(3).on(daysCountChanged, (_, value) => value)
export const $snacksCount = createStore(1).on(snacksCountChanged, (_, value) => value)

export const $slotsMap = createStore<SlotsMap>({})
  .on(recipeAssignedToSlot, (slots, payload) => ({
    ...slots,
    [payload.slotKey]: payload.recipeId,
  }))
  .on(slotsSwapped, (slots, payload) => {
    const sourceRecipe = slots[payload.sourceSlot]
    if (!sourceRecipe) {
      return slots
    }
    return {
      ...slots,
      [payload.sourceSlot]: slots[payload.targetSlot] ?? '',
      [payload.targetSlot]: sourceRecipe,
    }
  })
  .on(slotCleared, (slots, slotKey) => {
    const nextSlots = { ...slots }
    delete nextSlots[slotKey]
    return nextSlots
  })

export const $plannerError = createStore('')
  .on(plannerErrorSet, (_, message) => message)
  .reset(plannerMessagesReset)

export const $plannerSubmitMessage = createStore('')
  .on(plannerSubmitMessageSet, (_, message) => message)
  .reset(plannerMessagesReset)
