import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'
import { publicationService } from '@/services/publicationService'
import { ApiError } from '@/services/api'

function safeParseDate(dateString, referenceYear = null) {
  try {
    if (!dateString || !dateString.includes('-')) return null

    if (dateString.match(/^\d{1,2}-\d{1,2}$/)) {
      const year = referenceYear || new Date().getFullYear()
      const [month, day] = dateString.split('-')
      const d = new Date(year, parseInt(month) - 1, parseInt(day))
      return d
    }

    const date = new Date(dateString)
    if (!isNaN(date.getTime())) {
      return date
    }

    return null
  } catch (e) {
    return null
  }
}

export const useDataStore = defineStore('data', () => {
  const publications = ref([])
  const loading = ref(true)
  const error = ref(null)

  // Modo de operação: 'api' ou 'json'
  const useApi = ref(import.meta.env.VITE_USE_API !== 'false')
  
  const availableFiles = ref([
    'Mancha Verde vs Gaviões da Fiel.json',
    'sport recife violencia.json',
    'sport recife x santa cruz.json',
    'Torcida Garra CRB vs Mancha Azul CSA.json',
    'Torcida Jovem do Sport vs Inferno Coral Santa Cruz.json',
    'Torcida Organizada Bamor vs Torcida Uniformizada os Imbativeis.json',
  ])
  const selectedFile = ref(availableFiles.value[0])

  const startDate = ref(null)
  const endDate = ref(null)
  const selectedTag = ref('Todas')

  const minDate = ref(null)
  const maxDate = ref(null)

  async function loadData() {
    loading.value = true
    error.value = null
    startDate.value = null
    endDate.value = null
    minDate.value = null
    maxDate.value = null
    selectedTag.value = 'Todas'
    
    try {
      if (useApi.value) {
        // Usa a API do backend
        const response = await publicationService.list({ limit: 1000 })
        publications.value = response.items || []
      } else {
        // Modo legado: carrega de arquivo JSON
        if (!selectedFile.value) return
        const response = await fetch(`/json/${selectedFile.value}`)
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
        const data = await response.json()
        publications.value = Array.isArray(data) ? data : []
      }
    } catch (e) {
      console.error('Falha ao carregar dados:', e)
      if (e instanceof ApiError) {
        error.value = `Erro da API: ${e.message} (Status: ${e.status})`
      } else {
        error.value = e.message || 'Erro ao carregar dados'
      }
      publications.value = []
    } finally {
      loading.value = false
    }
  }
  
  async function loadDataWithFilters() {
    loading.value = true
    error.value = null
    
    try {
      if (!useApi.value) {
        // No modo JSON, apenas recarrega e aplica filtros localmente
        await loadData()
        return
      }
      
      // Usa a API com filtros
      const filters = {}
      
      if (startDate.value) {
        filters.startDate = startDate.value
      }
      
      if (endDate.value) {
        filters.endDate = endDate.value
      }
      
      if (selectedTag.value && selectedTag.value !== 'Todas') {
        filters.tags = [selectedTag.value]
      }
      
      const response = await publicationService.list({ ...filters, limit: 10000 })
      publications.value = response.items || []
    } catch (e) {
      console.error('Falha ao carregar dados com filtros:', e)
      if (e instanceof ApiError) {
        error.value = `Erro da API: ${e.message} (Status: ${e.status})`
      } else {
        error.value = e.message || 'Erro ao carregar dados'
      }
      publications.value = []
    } finally {
      loading.value = false
    }
  }

  function resetFilters() {
    startDate.value = minDate.value
    endDate.value = maxDate.value
    selectedTag.value = 'Todas'
  }

  const referenceYear = computed(() => {
    const yearCounts = {}
    publications.value.forEach((post) => {
      const yearMatch = (post.date || '').match(/\d{4}/)
      if (yearMatch) {
        const year = yearMatch[0]
        yearCounts[year] = (yearCounts[year] || 0) + 1
      }
    })
    if (Object.keys(yearCounts).length > 0) {
      return Object.keys(yearCounts).reduce((a, b) => (yearCounts[a] > yearCounts[b] ? a : b))
    }
    return new Date().getFullYear()
  })

  const processedPublications = computed(() => {
    const refYear = referenceYear.value
    return publications.value
      .map((post) => {
        return {
          ...post,
          parsedDate: safeParseDate(post.date, refYear),
        }
      })
      .filter((p) => p.parsedDate && !isNaN(p.parsedDate.getTime()))
  })

  const allTags = computed(() => {
    const tagsSet = new Set()
    processedPublications.value.forEach((post) => {
      ;(post.tags || []).forEach((tag) => tagsSet.add(tag))
    })
    return ['Todas', ...Array.from(tagsSet).sort()]
  })

  const filteredPublications = computed(() => {
    let data = processedPublications.value

    if (startDate.value) {
      try {
        const start = new Date(startDate.value + 'T00:00:00')
        if (!isNaN(start.getTime())) {
          data = data.filter((p) => p.parsedDate >= start)
        }
      } catch (e) {
        console.warn('Data de início inválida:', startDate.value)
      }
    }
    if (endDate.value) {
      try {
        const end = new Date(endDate.value + 'T23:59:59')
        if (!isNaN(end.getTime())) {
          data = data.filter((p) => p.parsedDate <= end)
        }
      } catch (e) {
        console.warn('Data de fim inválida:', endDate.value)
      }
    }

    if (selectedTag.value && selectedTag.value !== 'Todas') {
      data = data.filter((p) => (p.tags || []).includes(selectedTag.value))
    }

    return data
  })

  watch(processedPublications, (newPubs) => {
    if (newPubs.length > 0) {
      const dates = newPubs.map((p) => p.parsedDate.getTime())
      const minTime = Math.min(...dates)
      const maxTime = Math.max(...dates)

      const newMinDate = new Date(minTime).toISOString().split('T')[0]
      const newMaxDate = new Date(maxTime).toISOString().split('T')[0]

      minDate.value = newMinDate
      maxDate.value = newMaxDate

      startDate.value = newMinDate
      endDate.value = newMaxDate
    } else {
      minDate.value = null
      maxDate.value = null
      startDate.value = null
      endDate.value = null
    }
  })

  // Watch para recarregar quando filtros mudarem (modo API)
  watch([startDate, endDate, selectedTag], () => {
    if (useApi.value && (startDate.value || endDate.value || selectedTag.value !== 'Todas')) {
      loadDataWithFilters()
    }
  })

  return {
    publications,
    loading,
    error,
    useApi,
    availableFiles,
    selectedFile,
    loadData,
    loadDataWithFilters,
    resetFilters,
    startDate,
    endDate,
    selectedTag,
    allTags,
    minDate,
    maxDate,
    filteredPublications,
  }
})
