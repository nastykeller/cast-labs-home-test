<template>
  <div class="mp4-viewer__card">
    <h2>MP4 Files viewer</h2>
    <file-uploader></file-uploader>
  </div>
</template>

<script setup lang="ts">
import FileUploader from '@/components/FileUploader.vue'
</script>

<style scoped>
.mp4-viewer__card {
  max-width: 900px;
  margin: 0 auto;
}
</style>
