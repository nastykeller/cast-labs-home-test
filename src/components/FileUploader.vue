<template>
  <form @submit.prevent="handleSubmit" class="file-uploader">
    <input type="file" @change="handleFileChange" accept="video/mp4" class="file-uploader__input"/>

    <div class="file-uploader__buttons">
      <button type="submit" :disabled="isLoading || !file" class="file-uploader__button">Submit</button>
      <button type="button" @click="reset" class="file-uploader__button">Reset</button>
    </div>
    
    <div v-if="isLoading" class="file-uploader__loading">
      <p>Loading...</p>
    </div>
    
    <div v-else-if="boxes.length > 0">
      <h3>MP4 File Structure</h3>
      <ul>
        <li v-for="(box, index) in boxes" :key="index">
          <div>
            Type: {{ box.type }}, Size: {{ box.size }}
          </div>
          <ul v-if="box.children">
            <li v-for="(child, idx) in box.children" :key="idx">
              Type: {{ child.type }}, Size: {{ child.size }}
            </li>
          </ul>
          <div v-if="box.type === 'mdat'" class="file-uploader__mdat">
            {{ box.content }}
          </div>
        </li>
      </ul>
    </div>
  </form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Box } from '@/types/Box'

const fileList = ref<File[]>([])
const boxes = ref<Box[]>([])
const isLoading = ref(false)
const file = ref<File | null>(null)

const handleFileChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    file.value = files[0]
  }
}

const handleSubmit = () => {
  if (!file.value) return

  isLoading.value = true
  processFile(file.value)
}

const reset = () => {
  file.value = null
  fileList.value = []
  boxes.value = []
}

const processFile = (file: File) => {
  const reader = new FileReader()
  reader.onload = (e: ProgressEvent<FileReader>) => {
    const target = e.target as FileReader
    const arrayBuffer = target.result as ArrayBuffer
    parseMp4(arrayBuffer)
    isLoading.value = false
  }
  reader.readAsArrayBuffer(file)
}

const parseMp4 = (arrayBuffer: ArrayBuffer) => {
  const dataView = new DataView(arrayBuffer)
  let offset = 0

  const parseBox = (offset: number): Box => {
    const size = dataView.getUint32(offset)
    const type = String.fromCharCode(
      dataView.getUint8(offset + 4),
      dataView.getUint8(offset + 5),
      dataView.getUint8(offset + 6),
      dataView.getUint8(offset + 7)
    )
    const box: Box = { size, type, offset }
    if (type === 'moof' || type === 'traf') {
      box.children = []
      let childOffset = offset + 8
      while (childOffset < offset + size) {
        const childBox = parseBox(childOffset)
        box.children.push(childBox)
        childOffset += childBox.size
      }
    } else if (type === 'mdat') {
      const contentArrayBuffer = arrayBuffer.slice(offset + 8, offset + size)
      box.content = new TextDecoder('utf-8').decode(contentArrayBuffer)
    }
    return box
  }

  boxes.value = []
  while (offset < dataView.byteLength) {
    const box = parseBox(offset)
    boxes.value.push(box)
    offset += box.size
  }
}
</script>

<style lang="scss" scoped>
.file-uploader {
  display: flex;
  flex-direction: column;
  align-items: center;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;

  &__input {
    display: block;
    width: 100%;
    padding: 10px;
    margin-bottom: 20px;
    border: $border;
    border-radius: $border-radius;
    background-color: $white;
    font-size: $button-font-size;
  }

  &__buttons {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
  }

  &__button {
    padding: 10px 20px;
    border: none;
    border-radius: $border-radius;
    background-color: $primary;
    color: $white;
    font-size: $button-font-size;
    cursor: pointer;
    transition: background-color 0.3s;

    &:disabled {
      background-color: $disabled;
      cursor: not-allowed;
    }

    &:hover:not(:disabled) {
      background-color: $primary-subtle;
    }
  }

  &__loading {
    font-size: $button-font-size;
    color: $loading;
  }

  &__mdat {
    max-width: 600px;
    white-space: pre-wrap;
    word-wrap: break-word;
    background-color: $surface;
    padding: 10px;
    border: $border;
    border-radius: $border-radius;
    overflow: auto;
  }
}
</style>
