import PromptDialog from '~/components/PromptDialog.vue'

export interface PromptOption {
  label: string
  value: string
  tone?: 'primary' | 'neutral' | 'danger'
}

export interface PromptRequest {
  title: string
  message?: string
  options: PromptOption[]
  closeOnBackdrop?: boolean
  closeValue?: string | null
}

/**
 * Diálogos de escolha/confirmação sobre o overlay do Nuxt UI.
 * `openPrompt` resolve com o `value` da opção escolhida, ou com `closeValue`
 * quando o diálogo é fechado sem escolha (fora dele ou Esc).
 */
export const usePrompt = () => {
  const overlay = useOverlay()

  const openPrompt = async (request: PromptRequest): Promise<string | null> => {
    const dialog = overlay.create(PromptDialog, { destroyOnClose: true })
    const result = await dialog.open(request).result
    return result ?? request.closeValue ?? null
  }

  const askConfirm = async (params: {
    title: string
    message?: string
    confirmLabel?: string
    cancelLabel?: string
    confirmTone?: PromptOption['tone']
  }) => {
    const result = await openPrompt({
      title: params.title,
      message: params.message,
      options: [
        {
          label: params.confirmLabel ?? 'Confirmar',
          value: 'confirm',
          tone: params.confirmTone ?? 'primary',
        },
        {
          label: params.cancelLabel ?? 'Cancelar',
          value: 'cancel',
          tone: 'neutral',
        },
      ],
      closeOnBackdrop: true,
      closeValue: 'cancel',
    })

    return result === 'confirm'
  }

  return { openPrompt, askConfirm }
}
