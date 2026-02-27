<template>
  <div
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    @click.self="handleClose"
  >
    <div
      class="w-full max-w-xl rounded-xl bg-white p-4 shadow-2xl md:p-6"
      @click.stop
    >
      <div class="mb-4 flex items-center justify-between md:mb-6">
        <h2 class="text-xl font-bold text-gray-800 md:text-2xl">
          Exportar / Importar Dados
        </h2>
        <button
          @click="handleClose"
          class="flex h-8 w-8 items-center justify-center rounded-full
            text-gray-400 transition-colors hover:bg-gray-100
            hover:text-gray-600"
        >
          <Icon name="heroicons:x-mark" class="h-5 w-5" />
        </button>
      </div>

      <div class="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-gray-100 p-1">
        <button
          @click="mode = 'export'"
          :class="[
            'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'export'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800',
          ]"
        >
          Exportar
        </button>
        <button
          @click="mode = 'import'"
          :class="[
            'rounded-md px-3 py-2 text-sm font-semibold transition-colors',
            mode === 'import'
              ? 'bg-white text-blue-700 shadow-sm'
              : 'text-gray-600 hover:text-gray-800',
          ]"
        >
          Importar
        </button>
      </div>

      <div v-if="mode === 'export'" class="space-y-4">
        <p class="text-sm text-gray-600">
          Compartilhe jogadores e restrições via QR Code ou copiando o Base64.
        </p>

        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label class="mb-2 block text-xs font-semibold text-gray-700">
            Base64 dos dados (jogadores + regras)
          </label>
          <textarea
            :value="exportBase64"
            readonly
            rows="4"
            class="w-full resize-none rounded-lg border border-gray-300 bg-white
              px-3 py-2 text-xs focus:outline-none"
          />
          <button
            @click="handleCopyBase64"
            class="mt-3 w-full rounded-lg bg-blue-600 px-4 py-2 text-sm
              font-semibold text-white transition-colors hover:bg-blue-700"
          >
            Copiar Base64
          </button>
        </div>

        <div class="rounded-lg border border-gray-200 p-3">
          <label class="mb-2 block text-xs font-semibold text-gray-700">
            QR Code
          </label>
          <div class="flex justify-center rounded-lg bg-white p-3">
            <img
              v-if="qrCodeDataUrl"
              :src="qrCodeDataUrl"
              alt="QR Code dos dados de jogadores e regras"
              class="h-52 w-52"
            />
            <div v-else class="py-8 text-sm text-gray-500">
              Erro ao gerar QR Code
            </div>
          </div>
        </div>
      </div>

      <div v-else class="space-y-4">
        <p class="text-sm text-gray-600">
          A importação mescla jogadores e regras com os dados atuais, ignorando
          duplicados.
        </p>

        <div class="rounded-lg border border-gray-200 bg-gray-50 p-3">
          <label class="mb-2 block text-xs font-semibold text-gray-700">
            Colar Base64
          </label>
          <textarea
            v-model="importBase64"
            rows="4"
            placeholder="Cole aqui o conteúdo Base64"
            class="w-full resize-none rounded-lg border border-gray-300 bg-white
              px-3 py-2 text-xs focus:border-blue-500 focus:outline-none
              focus:ring-2 focus:ring-blue-500"
          />
          <button
            @click="handleImportBase64"
            :disabled="!importBase64.trim()"
            class="mt-3 w-full rounded-lg bg-green-600 px-4 py-2 text-sm
              font-semibold text-white transition-colors hover:bg-green-700
              disabled:cursor-not-allowed disabled:opacity-50"
          >
            Importar Base64
          </button>
        </div>

        <div class="rounded-lg border border-gray-200 p-3">
          <label class="mb-2 block text-xs font-semibold text-gray-700">
            Importar via câmera
          </label>

          <button
            @click="cameraActive ? stopCameraScan() : startCameraScan()"
            class="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors"
            :class="cameraActive ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'"
          >
            {{ cameraActive ? 'Parar câmera' : 'Ler QR pela câmera' }}
          </button>

          <p v-if="!isCameraSupported" class="mt-2 text-xs text-amber-700">
            Seu navegador não suporta leitura de QR por câmera neste modo.
          </p>

          <div v-if="cameraActive" class="mt-3 overflow-hidden rounded-lg border border-gray-200 bg-black">
            <div ref="cameraWrapperRef" class="relative">
              <video
                ref="videoRef"
                autoplay
                playsinline
                muted
                class="h-56 w-full object-cover"
              />

              <div class="pointer-events-none absolute inset-x-0 top-0 bg-black/55 px-3 py-2 text-center text-xs font-semibold text-white">
                Aponte a câmera para o QR Code
              </div>

              <div class="pointer-events-none absolute inset-0 flex items-center justify-center px-6 py-10">
                <div ref="guideFrameRef" class="h-40 w-40 rounded-2xl border-2 border-white/85 shadow-inner"></div>
              </div>

              <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-black/45 px-3 py-1.5 text-center text-[11px] text-white/90">
                A importação acontece automaticamente ao detectar
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 p-3">
          <label class="mb-2 block text-xs font-semibold text-gray-700">
            Importar via QR Code (imagem)
          </label>
          <input
            type="file"
            accept="image/*"
            @change="handleQrImageSelected"
            class="block w-full text-sm text-gray-700 file:mr-3 file:rounded-lg
              file:border-0 file:bg-blue-50 file:px-3 file:py-2
              file:font-semibold file:text-blue-700 hover:file:bg-blue-100"
          />
          <p class="mt-2 text-xs text-gray-500">
            Selecione uma imagem contendo o QR Code para importar.
          </p>
        </div>
      </div>

      <p
        v-if="feedbackMessage"
        class="mt-4 rounded-lg px-3 py-2 text-sm"
        :class="
          feedbackType === 'success'
            ? 'bg-green-50 text-green-700'
            : 'bg-red-50 text-red-700'
        "
      >
        {{ feedbackMessage }}
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import QRCode from 'qrcode'

const store = useScoreboardStore()
const { openPrompt } = usePrompt()

const emit = defineEmits<{
  close: []
}>()

const mode = ref<'export' | 'import'>('export')
const importBase64 = ref('')
const qrCodeDataUrl = ref('')
const feedbackMessage = ref('')
const feedbackType = ref<'success' | 'error'>('success')
const cameraActive = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const cameraWrapperRef = ref<HTMLDivElement | null>(null)
const guideFrameRef = ref<HTMLDivElement | null>(null)
let mediaStream: MediaStream | null = null
let scanInterval: ReturnType<typeof setInterval> | null = null
let isDetecting = false

const exportBase64 = computed(() => store.exportPlayersBase64())

const formatImportSummary = (result: {
  addedCount: number
  skippedCount: number
  ruleAddedCount: number
  ruleSkippedCount: number
}) => {
  return (
    `Jogadores: ${result.addedCount} adicionados, ${result.skippedCount} ignorados. ` +
    `Regras: ${result.ruleAddedCount} adicionadas, ${result.ruleSkippedCount} ignoradas.`
  )
}

const askImportMode = async () => {
  return openPrompt({
    title: 'Como deseja importar?',
    message:
      'Escolha entre substituir sua base local ou apenas mesclar com os dados atuais.',
    options: [
      {
        label: 'Substituir base local',
        value: 'replace',
        tone: 'danger',
      },
      {
        label: 'Mesclar com dados locais',
        value: 'merge',
        tone: 'primary',
      },
      {
        label: 'Cancelar importação',
        value: 'cancel',
        tone: 'neutral',
      },
    ],
    closeOnBackdrop: true,
    closeValue: 'cancel',
  })
}

const setFeedback = (type: 'success' | 'error', message: string) => {
  feedbackType.value = type
  feedbackMessage.value = message
}

const clearFeedback = () => {
  feedbackMessage.value = ''
}

const stopCameraScan = () => {
  if (scanInterval) {
    clearInterval(scanInterval)
    scanInterval = null
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop())
    mediaStream = null
  }

  if (videoRef.value) {
    videoRef.value.srcObject = null
  }

  cameraActive.value = false
}

const handleClose = () => {
  stopCameraScan()
  emit('close')
}

const generateQrCode = async () => {
  try {
    qrCodeDataUrl.value = await QRCode.toDataURL(exportBase64.value, {
      width: 320,
      margin: 1,
    })
  } catch {
    qrCodeDataUrl.value = ''
  }
}

watch(exportBase64, () => {
  generateQrCode()
}, { immediate: true })

const handleCopyBase64 = async () => {
  try {
    await navigator.clipboard.writeText(exportBase64.value)
    setFeedback('success', 'Base64 copiado para a área de transferência.')
  } catch {
    setFeedback('error', 'Não foi possível copiar automaticamente.')
  }
}

const handleImportBase64 = async () => {
  clearFeedback()

  try {
    const importMode = await askImportMode()
    if (importMode === 'cancel' || !importMode) {
      setFeedback('error', 'Importação cancelada.')
      return
    }

    const replaceLocalData = importMode === 'replace'
    const result = store.importPlayersFromBase64(
      importBase64.value,
      replaceLocalData,
    )
    setFeedback(
      'success',
      `Importação concluída. ${formatImportSummary(result)}`,
    )
  } catch {
    setFeedback('error', 'Base64 inválido ou formato de dados incorreto.')
  }
}

type BarcodeDetectorResult = {
  rawValue?: string
}

type BarcodeDetectorInstance = {
  detect: (source: ImageBitmapSource) => Promise<BarcodeDetectorResult[]>
}

type BarcodeDetectorConstructor = new (options?: {
  formats?: string[]
}) => BarcodeDetectorInstance

type BarcodeDetectorStatic = BarcodeDetectorConstructor & {
  getSupportedFormats?: () => Promise<string[]>
}

const isCameraSupported = ref(false)

const checkCameraSupport = async () => {
  if (!import.meta.client) {
    isCameraSupported.value = false
    return false
  }

  const hasCameraApi =
    typeof navigator !== 'undefined' &&
    !!navigator.mediaDevices?.getUserMedia

  const detectorConstructor = (
    window as Window & { BarcodeDetector?: BarcodeDetectorStatic }
  ).BarcodeDetector

  if (!hasCameraApi || !detectorConstructor) {
    isCameraSupported.value = false
    return false
  }

  if (typeof detectorConstructor.getSupportedFormats === 'function') {
    try {
      const supportedFormats = await detectorConstructor.getSupportedFormats()
      const hasQrSupport = supportedFormats.includes('qr_code')
      isCameraSupported.value = hasQrSupport
      return hasQrSupport
    } catch {
      isCameraSupported.value = false
      return false
    }
  }

  isCameraSupported.value = true
  return true
}

const detectQrInGuideArea = async (
  detector: BarcodeDetectorInstance,
  videoElement: HTMLVideoElement,
) => {
  const wrapperElement = cameraWrapperRef.value
  const frameElement = guideFrameRef.value

  if (!wrapperElement || !frameElement) {
    return [] as BarcodeDetectorResult[]
  }

  const sourceWidth = videoElement.videoWidth
  const sourceHeight = videoElement.videoHeight
  const containerWidth = wrapperElement.clientWidth
  const containerHeight = wrapperElement.clientHeight

  if (!sourceWidth || !sourceHeight || !containerWidth || !containerHeight) {
    return [] as BarcodeDetectorResult[]
  }

  const frameRect = frameElement.getBoundingClientRect()
  const wrapperRect = wrapperElement.getBoundingClientRect()

  const frameX = frameRect.left - wrapperRect.left
  const frameY = frameRect.top - wrapperRect.top
  const frameWidth = frameRect.width
  const frameHeight = frameRect.height

  const coverScale = Math.max(
    containerWidth / sourceWidth,
    containerHeight / sourceHeight,
  )

  const renderedVideoWidth = sourceWidth * coverScale
  const renderedVideoHeight = sourceHeight * coverScale

  const videoOffsetX = (containerWidth - renderedVideoWidth) / 2
  const videoOffsetY = (containerHeight - renderedVideoHeight) / 2

  const sourceX = (frameX - videoOffsetX) / coverScale
  const sourceY = (frameY - videoOffsetY) / coverScale
  const sourceCropWidth = frameWidth / coverScale
  const sourceCropHeight = frameHeight / coverScale

  const cropLeft = Math.max(0, sourceX)
  const cropTop = Math.max(0, sourceY)
  const cropRight = Math.min(sourceWidth, sourceX + sourceCropWidth)
  const cropBottom = Math.min(sourceHeight, sourceY + sourceCropHeight)
  const cropWidth = Math.floor(cropRight - cropLeft)
  const cropHeight = Math.floor(cropBottom - cropTop)

  if (cropWidth < 10 || cropHeight < 10) {
    return [] as BarcodeDetectorResult[]
  }

  const canvas = document.createElement('canvas')
  canvas.width = cropWidth
  canvas.height = cropHeight

  const context = canvas.getContext('2d')
  if (!context) {
    return [] as BarcodeDetectorResult[]
  }

  context.drawImage(
    videoElement,
    cropLeft,
    cropTop,
    cropWidth,
    cropHeight,
    0,
    0,
    cropWidth,
    cropHeight,
  )

  return detector.detect(canvas)
}

const startCameraScan = async () => {
  clearFeedback()

  const hasSupport = await checkCameraSupport()

  if (!hasSupport) {
    setFeedback(
      'error',
      'Leitura por câmera não suportada neste navegador.',
    )
    return
  }

  try {
    const detectorConstructor = (
      window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
    ).BarcodeDetector

    if (!detectorConstructor) {
      throw new Error('BarcodeDetector indisponível')
    }

    const detector = new detectorConstructor({ formats: ['qr_code'] })

    mediaStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment' },
      audio: false,
    })

    if (!videoRef.value) {
      throw new Error('Elemento de vídeo não disponível')
    }

    videoRef.value.srcObject = mediaStream
    await videoRef.value.play()
    cameraActive.value = true

    scanInterval = setInterval(async () => {
      if (!videoRef.value || isDetecting || !cameraActive.value) {
        return
      }

      isDetecting = true

      try {
          const result = await detectQrInGuideArea(detector, videoRef.value)
        const rawValue = result[0]?.rawValue?.trim()

        if (!rawValue) {
          return
        }

        importBase64.value = rawValue
        const importMode = await askImportMode()
        if (importMode === 'cancel' || !importMode) {
          setFeedback('error', 'Importação cancelada.')
          return
        }

        const replaceLocalData = importMode === 'replace'
        const importResult = store.importPlayersFromBase64(
          rawValue,
          replaceLocalData,
        )

        setFeedback(
          'success',
          `QR importado. ${formatImportSummary(importResult)}`,
        )
        stopCameraScan()
      } catch {
      } finally {
        isDetecting = false
      }
    }, 500)
  } catch {
    stopCameraScan()
    setFeedback(
      'error',
      'Não foi possível iniciar a câmera para leitura de QR Code.',
    )
  }
}

const decodeQrFromImage = async (file: File) => {
  const detectorConstructor = (
    window as Window & { BarcodeDetector?: BarcodeDetectorConstructor }
  ).BarcodeDetector

  if (!detectorConstructor) {
    throw new Error('BarcodeDetector não suportado')
  }

  const detector = new detectorConstructor({ formats: ['qr_code'] })
  const imageBitmap = await createImageBitmap(file)

  try {
    const result = await detector.detect(imageBitmap)
    const rawValue = result[0]?.rawValue?.trim()

    if (!rawValue) {
      throw new Error('QR Code não encontrado')
    }

    return rawValue
  } finally {
    imageBitmap.close()
  }
}

const handleQrImageSelected = async (event: Event) => {
  clearFeedback()

  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (!file) {
    return
  }

  try {
    const decodedBase64 = await decodeQrFromImage(file)
    importBase64.value = decodedBase64
    const importMode = await askImportMode()
    if (importMode === 'cancel' || !importMode) {
      setFeedback('error', 'Importação cancelada.')
      return
    }

    const replaceLocalData = importMode === 'replace'
    const result = store.importPlayersFromBase64(
      decodedBase64,
      replaceLocalData,
    )

    setFeedback(
      'success',
      `QR importado. ${formatImportSummary(result)}`,
    )
  } catch {
    setFeedback(
      'error',
      'Não foi possível ler o QR Code desta imagem neste navegador.',
    )
  } finally {
    target.value = ''
  }
}

watch(mode, (currentMode) => {
  if (currentMode !== 'import') {
    stopCameraScan()
  }
})

onMounted(() => {
  checkCameraSupport()
})

onBeforeUnmount(() => {
  stopCameraScan()
})
</script>
