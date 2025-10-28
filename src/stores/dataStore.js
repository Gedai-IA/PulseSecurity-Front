import { ref, computed, watch } from 'vue'
import { defineStore } from 'pinia'

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

  const availableFiles = ref([
    'Mancha Verde vs Gaviões da Fiel violência_progress.json',
    'sport recife violencia_progress.json',
    'sport recife x santa cruz_progress.json',
    'Torcida Garra CRB vs Mancha Azul CSA violência_progress.json',
    'Torcida Jovem do Sport vs Inferno Coral Santa Cruz violência_progress.json',
  ])
  const selectedFile = ref(availableFiles.value[0])

  const startDate = ref(null)
  const endDate = ref(null)
  const selectedTag = ref('Todas')

  const minDate = ref(null)
  const maxDate = ref(null)

  async function loadData() {
    if (!selectedFile.value) return
    loading.value = true
    error.value = null
    startDate.value = null
    endDate.value = null
    minDate.value = null
    maxDate.value = null
    selectedTag.value = 'Todas'
    try {
      const response = await fetch(`/json/${selectedFile.value}`)
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      publications.value = Array.isArray(data) ? data : []
    } catch (e) {
      console.error('Falha ao carregar o arquivo JSON:', e)
      error.value = e.message
      publications.value = []
    } finally {
      loading.value = false
    }
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

  return {
    publications,
    loading,
    error,
    availableFiles,
    selectedFile,
    loadData,

    startDate,
    endDate,
    selectedTag,
    allTags,

    minDate,
    maxDate,

    filteredPublications,
    processedPublications,
  }
})
