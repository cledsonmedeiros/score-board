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

let activeResolver: ((value: string | null) => void) | null = null

export const usePrompt = () => {
  const request = useState<PromptRequest | null>('app-prompt-request', () => null)

  const openPrompt = (nextRequest: PromptRequest) => {
    const closeOnBackdrop = nextRequest.closeOnBackdrop ?? true
    const closeValue = nextRequest.closeValue ?? null

    if (activeResolver) {
      activeResolver(closeValue)
      activeResolver = null
    }

    request.value = {
      ...nextRequest,
      closeOnBackdrop,
      closeValue,
    }

    return new Promise<string | null>((resolve) => {
      activeResolver = resolve
    })
  }

  const resolvePrompt = (value: string | null) => {
    request.value = null

    if (activeResolver) {
      activeResolver(value)
      activeResolver = null
    }
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
          label: params.cancelLabel ?? 'Cancelar',
          value: 'cancel',
          tone: 'neutral',
        },
        {
          label: params.confirmLabel ?? 'Confirmar',
          value: 'confirm',
          tone: params.confirmTone ?? 'primary',
        },
      ],
      closeOnBackdrop: true,
      closeValue: 'cancel',
    })

    return result === 'confirm'
  }

  return {
    request,
    openPrompt,
    resolvePrompt,
    askConfirm,
  }
}
