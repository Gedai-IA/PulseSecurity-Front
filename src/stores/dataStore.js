import { ref } from 'vue'
import { defineStore } from 'pinia'

export const useDataStore = defineStore('data', () => {
  const publications = ref([])
  const loading = ref(true)

  const availableFiles = ref([
    'Mancha Verde vs Gaviões da Fiel violência_progress.json',
    'sport recife violencia_progress.json',
    'sport recife x santa cruz_progress.json',
    'Torcida Garra CRB vs Mancha Azul CSA violência_progress.json',
    'Torcida Jovem do Sport vs Inferno Coral Santa Cruz violência_progress.json',
  ])
  const selectedFile = ref(availableFiles.value[0])

  async function loadData() {
    if (!selectedFile.value) return
    loading.value = true
    try {
      const response = await fetch(`/json/${selectedFile.value}`)
      const data = await response.json()
      publications.value = data
    } catch (error) {
      console.error('Falha ao carregar o arquivo JSON:', error)
      publications.value = []
    } finally {
      loading.value = false
    }
  }

  return { publications, loading, availableFiles, selectedFile, loadData }
})
