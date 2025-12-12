<template>
  <div class="object-detector-page">
    <header class="page-header">
      <h1 class="main-title">
        <i class="fas fa-eye"></i>
        Object Detector - Visão Computacional
      </h1>
      <p class="subtitle">Detecção de objetos nocivos em imagens usando YOLO</p>
    </header>

    <div class="detector-container">
      <!-- Upload Section -->
      <div class="upload-section">
        <div class="upload-card">
          <h2 class="section-title">
            <i class="fas fa-upload"></i>
            Upload de Imagem
          </h2>
          
          <div class="upload-area" 
               :class="{ 'drag-over': isDragOver, 'has-image': selectedImage }"
               @dragover.prevent="handleDragOver"
               @dragleave.prevent="handleDragLeave"
               @drop.prevent="handleDrop">
            <input 
              ref="fileInput"
              type="file" 
              accept="image/*" 
              @change="handleFileSelect"
              class="file-input"
              :disabled="isProcessing"
            />
            
            <div v-if="!selectedImage" class="upload-placeholder">
              <i class="fas fa-cloud-upload-alt"></i>
              <p>Arraste uma imagem aqui ou clique para selecionar</p>
              <p class="upload-hint">Formatos suportados: JPG, PNG, BMP</p>
            </div>
            
            <div v-else class="image-preview">
              <img :src="imagePreviewUrl" alt="Preview" />
              <button @click="clearImage" class="clear-btn" :disabled="isProcessing">
                <i class="fas fa-times"></i>
              </button>
            </div>
          </div>

          <div class="controls">
            <div class="confidence-control">
              <label for="confidence">Confiança Mínima:</label>
              <input 
                type="range" 
                id="confidence" 
                v-model.number="confidenceThreshold" 
                min="0.1" 
                max="1" 
                step="0.05"
                :disabled="isProcessing"
              />
              <span class="confidence-value">{{ (confidenceThreshold * 100).toFixed(0) }}%</span>
            </div>

            <button 
              @click="processImage" 
              class="process-btn"
              :disabled="!selectedImage || isProcessing"
            >
              <i class="fas fa-search" v-if="!isProcessing"></i>
              <i class="fas fa-spinner fa-spin" v-else></i>
              {{ isProcessing ? 'Processando...' : 'Detectar Objetos' }}
            </button>
          </div>
        </div>
      </div>

      <!-- Results Section -->
      <div v-if="detectionResult" class="results-section">
        <div class="results-card">
          <h2 class="section-title">
            <i class="fas fa-check-circle"></i>
            Resultados da Detecção
          </h2>

          <div class="results-grid">
            <!-- Annotated Image -->
            <div class="result-image-card">
              <h3>Imagem Anotada</h3>
              <div class="annotated-image-container">
                <img 
                  v-if="annotatedImageUrl" 
                  :src="annotatedImageUrl" 
                  alt="Imagem com detecções"
                  class="annotated-image"
                />
                <div v-else class="loading-image">
                  <i class="fas fa-spinner fa-spin"></i>
                  <p>Carregando imagem...</p>
                </div>
              </div>
            </div>

            <!-- Detection Stats -->
            <div class="stats-card">
              <h3>Estatísticas</h3>
              <div class="stats-grid">
                <div class="stat-item">
                  <i class="fas fa-bullseye"></i>
                  <div>
                    <span class="stat-label">Total de Detecções</span>
                    <span class="stat-value">{{ detectionResult.predictions?.length || 0 }}</span>
                  </div>
                </div>
                <div class="stat-item">
                  <i class="fas fa-clock"></i>
                  <div>
                    <span class="stat-label">Tempo de Processamento</span>
                    <span class="stat-value">{{ processingTime }}s</span>
                  </div>
                </div>
              </div>

              <!-- Detections List -->
              <div v-if="detectionResult.predictions && detectionResult.predictions.length > 0" class="detections-list">
                <h4>Objetos Detectados</h4>
                <div class="detection-items">
                  <div 
                    v-for="(detection, index) in detectionResult.predictions" 
                    :key="index"
                    class="detection-item"
                  >
                    <div class="detection-info">
                      <span class="detection-class">{{ detection.class_name || 'Objeto' }}</span>
                      <span class="detection-confidence">
                        {{ (detection.conf * 100).toFixed(1) }}%
                      </span>
                    </div>
                    <div class="detection-box">
                      Box: [{{ detection.xyxy?.map(v => v.toFixed(0)).join(', ') }}]
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="no-detections">
                <i class="fas fa-info-circle"></i>
                <p>Nenhum objeto detectado</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div v-if="error" class="error-message">
        <i class="fas fa-exclamation-triangle"></i>
        <p>{{ error }}</p>
        <button @click="error = null" class="close-error">
          <i class="fas fa-times"></i>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { objectDetectorService } from '@/services/objectDetectorService'

const fileInput = ref(null)
const selectedImage = ref(null)
const imagePreviewUrl = ref(null)
const isDragOver = ref(false)
const isProcessing = ref(false)
const confidenceThreshold = ref(0.25)
const detectionResult = ref(null)
const annotatedImageUrl = ref(null)
const processingTime = ref(0)
const error = ref(null)

const handleDragOver = (e) => {
  isDragOver.value = true
}

const handleDragLeave = (e) => {
  isDragOver.value = false
}

const handleDrop = (e) => {
  isDragOver.value = false
  const files = e.dataTransfer.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

const handleFileSelect = (e) => {
  const files = e.target.files
  if (files.length > 0) {
    handleFile(files[0])
  }
}

const handleFile = (file) => {
  if (!file.type.startsWith('image/')) {
    error.value = 'Por favor, selecione um arquivo de imagem válido'
    return
  }

  selectedImage.value = file
  const reader = new FileReader()
  reader.onload = (e) => {
    imagePreviewUrl.value = e.target.result
  }
  reader.readAsDataURL(file)
  detectionResult.value = null
  annotatedImageUrl.value = null
  error.value = null
}

const clearImage = () => {
  selectedImage.value = null
  imagePreviewUrl.value = null
  detectionResult.value = null
  annotatedImageUrl.value = null
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}

const processImage = async () => {
  if (!selectedImage.value) return

  isProcessing.value = true
  error.value = null
  const startTime = Date.now()

  try {
    const formData = new FormData()
    formData.append('image', selectedImage.value)
    formData.append('confidence', confidenceThreshold.value.toString())

    const result = await objectDetectorService.predict(formData)
    
    detectionResult.value = result
    processingTime.value = ((Date.now() - startTime) / 1000).toFixed(2)

    // Load annotated image if available
    if (result.annotated_image_url) {
      // Construir URL completa
      const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
      annotatedImageUrl.value = `${baseUrl}${result.annotated_image_url}`
    } else if (result.annotated_path) {
      // If we get a path, we might need to fetch it from the backend
      annotatedImageUrl.value = await objectDetectorService.getAnnotatedImage(result.annotated_path)
    }
  } catch (err) {
    error.value = err.message || 'Erro ao processar imagem. Tente novamente.'
    console.error('Error processing image:', err)
  } finally {
    isProcessing.value = false
  }
}

onUnmounted(() => {
  // Cleanup
  if (imagePreviewUrl.value && imagePreviewUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(imagePreviewUrl.value)
  }
})
</script>

<style scoped>
.object-detector-page {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 2rem;
}

.main-title {
  font-size: 2rem;
  font-weight: 700;
  color: #2c3e50;
  margin: 0 0 0.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.main-title i {
  color: #3498db;
}

.subtitle {
  color: #7f8c8d;
  font-size: 1rem;
  margin: 0;
}

.detector-container {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.upload-section,
.results-section {
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  padding: 2rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1.5rem 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.section-title i {
  color: #3498db;
}

.upload-area {
  border: 2px dashed #bdc3c7;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  min-height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-area:hover {
  border-color: #3498db;
  background-color: #f8f9fa;
}

.upload-area.drag-over {
  border-color: #3498db;
  background-color: #e3f2fd;
}

.upload-area.has-image {
  padding: 0;
  border: none;
  min-height: auto;
}

.file-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #7f8c8d;
}

.upload-placeholder i {
  font-size: 4rem;
  color: #bdc3c7;
}

.upload-hint {
  font-size: 0.9rem;
  color: #95a5a6;
}

.image-preview {
  position: relative;
  width: 100%;
  max-height: 500px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.image-preview img {
  max-width: 100%;
  max-height: 500px;
  border-radius: 8px;
  object-fit: contain;
}

.clear-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: background 0.2s;
}

.clear-btn:hover:not(:disabled) {
  background: rgba(231, 76, 60, 1);
}

.controls {
  margin-top: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.confidence-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.confidence-control label {
  font-weight: 500;
  color: #2c3e50;
  min-width: 150px;
}

.confidence-control input[type="range"] {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: #ecf0f1;
  outline: none;
}

.confidence-control input[type="range"]::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #3498db;
  cursor: pointer;
}

.confidence-value {
  font-weight: 600;
  color: #3498db;
  min-width: 60px;
  text-align: right;
}

.process-btn {
  padding: 1rem 2rem;
  background: #3498db;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.process-btn:hover:not(:disabled) {
  background: #2980b9;
}

.process-btn:disabled {
  background: #bdc3c7;
  cursor: not-allowed;
}

.results-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

@media (min-width: 992px) {
  .results-grid {
    grid-template-columns: 2fr 1fr;
  }
}

.result-image-card,
.stats-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 1.5rem;
}

.result-image-card h3,
.stats-card h3 {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.annotated-image-container {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  background: #ffffff;
  border-radius: 8px;
  overflow: hidden;
}

.annotated-image {
  max-width: 100%;
  max-height: 600px;
  object-fit: contain;
}

.loading-image {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  color: #7f8c8d;
}

.loading-image i {
  font-size: 2rem;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
}

.stat-item i {
  font-size: 1.5rem;
  color: #3498db;
}

.stat-item div {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.stat-label {
  font-size: 0.9rem;
  color: #7f8c8d;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2c3e50;
}

.detections-list h4 {
  font-size: 1rem;
  font-weight: 600;
  color: #2c3e50;
  margin: 0 0 1rem 0;
}

.detection-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
}

.detection-item {
  padding: 1rem;
  background: #ffffff;
  border-radius: 8px;
  border-left: 4px solid #3498db;
}

.detection-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.detection-class {
  font-weight: 600;
  color: #2c3e50;
}

.detection-confidence {
  font-weight: 600;
  color: #27ae60;
}

.detection-box {
  font-size: 0.85rem;
  color: #7f8c8d;
  font-family: monospace;
}

.no-detections {
  text-align: center;
  padding: 2rem;
  color: #7f8c8d;
}

.no-detections i {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.error-message {
  background: #fee;
  border: 1px solid #fcc;
  border-radius: 8px;
  padding: 1rem 1.5rem;
  color: #c0392b;
  display: flex;
  align-items: center;
  gap: 1rem;
  position: relative;
}

.error-message i {
  font-size: 1.5rem;
}

.error-message p {
  margin: 0;
  flex: 1;
}

.close-error {
  background: none;
  border: none;
  color: #c0392b;
  cursor: pointer;
  font-size: 1.2rem;
  padding: 0.25rem 0.5rem;
}

.close-error:hover {
  opacity: 0.7;
}
</style>

