export function useOrientation() {
  const isLandscape = useState<boolean>('is-landscape', () => false)

  const updateOrientation = () => {
    if (typeof window !== 'undefined') {
      isLandscape.value = window.innerWidth > window.innerHeight
    }
  }

  onMounted(() => {
    updateOrientation()
    window.addEventListener('resize', updateOrientation)
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateOrientation)
    }
  })

  return {
    isLandscape,
  }
}
