export function useOrientation() {
  type LockableScreenOrientation = ScreenOrientation & {
    lock?: (orientation: 'landscape' | 'portrait') => Promise<void>
    unlock?: () => void
  }

  const isDeviceLandscape = useState<boolean>('is-device-landscape', () => false)
  const lockEnabled = useState<boolean>('orientation-lock-enabled', () => false)
  const preferredOrientation = useState<'landscape' | 'portrait'>(
    'preferred-orientation',
    () => 'landscape',
  )
  const preferenceLoaded = useState<boolean>('orientation-preference-loaded', () => false)

  const isLandscape = computed(() => {
    return lockEnabled.value
      ? preferredOrientation.value === 'landscape'
      : isDeviceLandscape.value
  })

  const updateOrientation = () => {
    if (typeof window !== 'undefined') {
      isDeviceLandscape.value = window.innerWidth > window.innerHeight
    }
  }

  const loadPreference = () => {
    if (typeof window === 'undefined' || preferenceLoaded.value) {
      return
    }

    const stored = localStorage.getItem('scoreboard-preferred-orientation')
    if (stored === 'landscape' || stored === 'portrait') {
      preferredOrientation.value = stored
    }

    preferenceLoaded.value = true
  }

  const applyNativeOrientationLock = async () => {
    if (typeof window === 'undefined') {
      return
    }

    const screenOrientation = window.screen?.orientation as LockableScreenOrientation | undefined
    if (!screenOrientation) {
      return
    }

    if (lockEnabled.value) {
      if (typeof screenOrientation.lock !== 'function') {
        return
      }

      try {
        await screenOrientation.lock(preferredOrientation.value)
      } catch {
      }
      return
    }

    if (typeof screenOrientation.unlock !== 'function') {
      return
    }

    try {
      screenOrientation.unlock()
    } catch {
    }
  }

  const setPreferredOrientation = (orientation: 'landscape' | 'portrait') => {
    preferredOrientation.value = orientation

    if (typeof window !== 'undefined') {
      localStorage.setItem('scoreboard-preferred-orientation', orientation)
    }
  }

  const enableOrientationLock = async () => {
    loadPreference()
    lockEnabled.value = true
    await applyNativeOrientationLock()
  }

  const disableOrientationLock = async () => {
    lockEnabled.value = false
    await applyNativeOrientationLock()
  }

  onMounted(() => {
    loadPreference()
    updateOrientation()
    window.addEventListener('resize', updateOrientation)
  })

  onUnmounted(() => {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', updateOrientation)
    }
  })

  watch(preferredOrientation, () => {
    if (lockEnabled.value) {
      applyNativeOrientationLock()
    }
  })

  return {
    isLandscape,
    lockEnabled,
    preferredOrientation,
    setPreferredOrientation,
    enableOrientationLock,
    disableOrientationLock,
  }
}
