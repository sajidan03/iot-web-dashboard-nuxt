<script setup lang="ts">
const data = ref<any>(null)
const error = ref(false)
const loading = ref(false)

const uiRelay1 = ref(false)
const uiRelay2 = ref(false)

const backendRelay1 = ref(false)
const backendRelay2 = ref(false)

const fetchData = async () => {
  try {
    const res = await $fetch('/api/antares/latest')
    data.value = res
  } catch (e) {
    error.value = true
  }
}

const sendRelayCommand = async () => {
  try {
    loading.value = true
    const res = await $fetch('/api/antares/control', {
      method: 'POST',
      body: {
        relay1: uiRelay1.value ? 1 : 0,
        relay2: uiRelay2.value ? 1 : 0
      }
    })
    console.log('Relay command sent:', res)
    
    backendRelay1.value = uiRelay1.value
    backendRelay2.value = uiRelay2.value
  } catch (e) {
    console.error('Failed to send relay command:', e)
    error.value = true
    uiRelay1.value = backendRelay1.value
    uiRelay2.value = backendRelay2.value
  } finally {
    loading.value = false
  }
}

let debounceTimer: ReturnType<typeof setTimeout>
watch([uiRelay1, uiRelay2], () => {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    sendRelayCommand()
  }, 300)
})

onMounted(() => {
  fetchData()
  setInterval(fetchData, 5000)
})

const parsed = computed(() => {
  if (!data.value) return null

  const cin = data.value['m2m:cin']
  const payload = JSON.parse(cin.con)

  // Update backend state
  if (payload.relay1 !== undefined) {
    backendRelay1.value = payload.relay1 === 1
  }
  if (payload.relay2 !== undefined) {
    backendRelay2.value = payload.relay2 === 1
  }

  return {
    temperature: payload.temperature?.toFixed(1),
    magnet: payload.magnet,
    relay1: payload.relay1,
    relay2: payload.relay2,
    time: new Date(cin.ct).toLocaleTimeString()
  }
})

// Computed untuk tampilan status
const relay1Status = computed(() => uiRelay1.value ? 'ON' : 'OFF')
const relay2Status = computed(() => uiRelay2.value ? 'ON' : 'OFF')

// Sync button jika ingin sinkron manual
const syncWithBackend = () => {
  uiRelay1.value = backendRelay1.value
  uiRelay2.value = backendRelay2.value
}
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white p-6">
    <h1 class="text-3xl font-bold mb-6">IoT Dashboard</h1>

    <div v-if="!parsed" class="text-gray-400">
      Loading data...
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
      
      <!-- Temperature -->
      <div class="bg-gray-800 rounded-xl p-6 shadow">
        <p class="text-gray-400">Temperature</p>
        <p class="text-4xl font-bold mt-2">
          {{ parsed.temperature }}°C
        </p>
      </div>

      <!-- Magnet -->
      <div
        class="rounded-xl p-6 shadow"
        :class="parsed.magnet ? 'bg-red-600' : 'bg-green-600'"
      >
        <p class="text-white">Magnet Sensor</p>
        <p class="text-3xl font-bold mt-2">
          {{ parsed.magnet ? 'Tidak menempel' : 'Menempel' }}
        </p>
      </div>

      <!-- Relay Control Card -->
      <div class="md:col-span-2 bg-gray-800 rounded-xl p-6 shadow">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-bold">Relay Control</h2>
          <button 
            @click="syncWithBackend"
            class="text-sm bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded transition-colors"
          >
            Sync dengan Device
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Relay 1 -->
          <div class="bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-300">Relay 1</p>
                <p class="text-sm text-gray-400 mt-1">
                  Status: {{ relay1Status }}
                  <span v-if="uiRelay1 !== backendRelay1" class="text-yellow-400 ml-2">
                    (Pending)
                  </span>
                </p>
                <p class="text-xs text-gray-500">
                  Device: {{ backendRelay1 ? 'ON' : 'OFF' }}
                </p>
              </div>
              
              <button
                @click="uiRelay1 = !uiRelay1"
                :disabled="loading"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  uiRelay1 ? 'bg-blue-600' : 'bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    uiRelay1 ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
            
            <!-- Status LED Indicator -->
            <div class="mt-4 flex items-center">
              <div
                :class="[
                  'w-3 h-3 rounded-full mr-2',
                  uiRelay1 ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                ]"
              />
              <span class="text-sm text-gray-300">
                {{ uiRelay1 ? 'Active - Relay is ON' : 'Inactive - Relay is OFF' }}
              </span>
            </div>
          </div>

          <!-- Relay 2 -->
          <div class="bg-gray-700 rounded-lg p-4">
            <div class="flex items-center justify-between">
              <div>
                <p class="text-gray-300">Relay 2</p>
                <p class="text-sm text-gray-400 mt-1">
                  Status: {{ relay2Status }}
                  <span v-if="uiRelay2 !== backendRelay2" class="text-yellow-400 ml-2">
                    (Pending)
                  </span>
                </p>
                <p class="text-xs text-gray-500">
                  Device: {{ backendRelay2 ? 'ON' : 'OFF' }}
                </p>
              </div>
              
              <button
                @click="uiRelay2 = !uiRelay2"
                :disabled="loading"
                :class="[
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  uiRelay2 ? 'bg-blue-600' : 'bg-gray-600'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    uiRelay2 ? 'translate-x-6' : 'translate-x-1'
                  ]"
                />
              </button>
            </div>
            
            <div class="mt-4 flex items-center">
              <div
                :class="[
                  'w-3 h-3 rounded-full mr-2',
                  uiRelay2 ? 'bg-green-500 animate-pulse' : 'bg-red-500'
                ]"
              />
              <span class="text-sm text-gray-300">
                {{ uiRelay2 ? 'Active - Relay is ON' : 'Inactive - Relay is OFF' }}
              </span>
            </div>
          </div>

          <div class="md:col-span-2 mt-4 p-3 bg-gray-900 rounded-lg">
            <div class="flex items-start">
              <svg class="w-5 h-5 text-blue-400 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
              </svg>
              <div>
                <p class="text-sm text-gray-300">
                    Harap sabar ada delay 3-5 detik
                  <span v-if="loading" class="text-yellow-400 ml-1">Mengirim perintah...</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="md:col-span-2 flex justify-between items-center text-gray-400 text-sm">
        <div>
          Last update: {{ parsed.time }}
        </div>
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-green-500 mr-1"></div>
            <span>ON</span>
          </div>
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-red-500 mr-1"></div>
            <span>OFF</span>
          </div>
          <div class="flex items-center">
            <div class="w-2 h-2 rounded-full bg-yellow-500 mr-1"></div>
            <span>Pending</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
button {
  transition: background-color 0.2s;
}

span {
  transition: transform 0.2s;
}
</style>