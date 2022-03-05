<template>
  <div class="picture-in-picture">
    <button
      class="pip-button"
      @click="togglePiP"
    >
      PiP
      <video
        ref="screenVideo"
        style="display: none"
        autoplay
      />
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const screenVideo = ref(null as HTMLVideoElement | null)

const screenStream = ref<MediaStream|null>(null)

async function startPiP () {
  // const video = this.$refs.screenVideo as HTMLVideoElement
  // video.autoPictureInPicture = true

  // @ts-ignore
  screenStream.value = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true, audio: false })

  if (screenVideo.value) {
    screenVideo.value.srcObject = screenStream.value

    // @ts-ignore
    screenVideo.value.onloadedmetadata = () => screenVideo.value.requestPictureInPicture()

    // @ts-ignore
    screenVideo.value.onleavepictureinpicture = screenStream.value.oninactive = () => {
      stopPiP()
    }
  }
}

async function stopPiP () {
  // @ts-ignore
  if (document.pictureInPictureElement) {
    // @ts-ignore
    document.exitPictureInPicture()
  }
  if (screenStream.value) {
    screenStream.value.getTracks().forEach((track: MediaStreamTrack) => track.stop())
  }

  if (screenVideo.value) {
    screenVideo.value.srcObject = null
  }
}

async function togglePiP () {
  if (screenStream.value) {
    stopPiP()
  } else {
    startPiP()
  }
}

</script>

<style>
.pip-button {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  background-color: black;
  border-radius: 50%;
}
</style>
