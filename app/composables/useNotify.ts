/** Avisos curtos (toasts) no lugar de `alert()`. */
export const useNotify = () => {
  const toast = useToast()

  return {
    success: (title: string) =>
      toast.add({ title, color: 'success', icon: 'i-heroicons-check-circle' }),
    error: (title: string) =>
      toast.add({
        title,
        color: 'error',
        icon: 'i-heroicons-exclamation-triangle',
      }),
  }
}
