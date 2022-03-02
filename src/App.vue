<template>
  <div
    class="app"
    :class="{
      'timer-active': timerId,
      'pomodori': timerType === 'pomodori',
      'break': timerType === 'break',
    }"
  >
    <!-- <audio
      src="/public/tick.mp3"
      ref="audioTick"
      id="audioTick"
      crossorigin="anonymous"
    /> -->
    <div class="container">
      <button
        class="pip-button"
        @click="togglePiP"
      >
        PiP
      </button>
      <div class="timer">
        <input
          v-if="enableHours"
          v-model="modelHours"
          type="text"
          @input="onDurationInput"
        >
        <div
          v-if="enableHours"
          class="sep"
        >
          :
        </div>
        <input
          v-model="modelMins"
          type="text"
          @input="onDurationInput"
        >
        <div class="sep">
          :
        </div>
        <input
          v-model="modelSecs"
          type="text"
          @input="onDurationInput"
        >
      </div>

      <div
        v-if="timerType === 'pomodori'"
        class="timer-details"
      >
        <input
          v-model="taskDescription"
          type="text"
          placeholder="(Optional) Current task"
        >
      </div>

      <div
        v-else
        class="timer-details break"
      >
        <div>It is break time.</div>
      </div>

      <div class="timer-btns">
        <button
          class="toggle-timer"
          @click="toggleTimer"
        >
          <span v-if="!timerId">Start</span>
          <span v-else>Pause</span>
        </button>
        <button
          v-if="totalSecs !== timerDuration[timerType]"
          class="reset-timer"
          @click="resetTimer"
        >
          Reset
        </button>
        <button
          v-else
          class="skip-timer"
          @click="skipTimer"
        >
          Skip
        </button>
      </div>

      <video
        ref="screenVideo"
        style="display: none"
        autoplay
      />
      <!-- <div class="stats">
        <span class="title">Stats</span>
        <div><b>{{ todayTimerCount['pomodori'] }}</b> pomodori today</div>
        <div><b>{{ todayTimerCount['break'] }}</b> breaks today</div>
        <br>
        <div><b>{{ totalTimerCount['pomodori'] }}</b> pomodori in total</div>
        <div><b>{{ totalTimerCount['break'] }}</b> breaks in total</div>
      </div> -->
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import { storeJSON, loadJSON, storeString, loadString } from './utils/localStorageUtils'

type TimerType = 'pomodori' | 'break'

export default defineComponent({
  name: 'App',

  data () {
    return {
      timerDuration: {
        pomodori: 25 * 60,
        break: 5 * 60
      },
      todayTimerCount: {
        pomodori: 0,
        break: 0
      },
      totalTimerCount: {
        pomodori: 0,
        break: 0
      },
      tickSound: true,
      timeoutSound: true,
      timerType: 'pomodori' as TimerType,
      enableHours: false,
      modelHours: '00',
      modelMins: '00',
      modelSecs: '00',
      totalSecs: 0,
      taskDescription: '',
      screenStream: null as MediaStream | null,
      timerId: undefined as number | undefined
    }
  },

  watch: {
    timerType () {
      storeString('timerType', this.timerType)
      this.pauseTimer()
      this.totalSecs = this.timerDuration[this.timerType]
    },

    totalSecs () {
      this.modelHours = this.formatNum(this.secsTo('h').toString())
      this.modelMins = this.formatNum(this.secsTo('m').toString())
      this.modelSecs = this.formatNum(this.secsTo('s').toString())
    },

    taskDescription () {
      storeString('taskDescription', this.taskDescription)
    }
  },

  created () {
    this.taskDescription = loadString('taskDescription') || ''
    this.timerDuration = loadJSON('timerDuration') || this.timerDuration
    this.timerType = loadString('timerType') as TimerType || this.timerType
    this.todayTimerCount = loadJSON(`timerCount-${this.today()}`) || this.todayTimerCount
    this.totalSecs = loadJSON('totalSecs') || this.timerDuration[this.timerType]

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('timerCount-')) {
        const json = loadJSON(key) as any
        this.totalTimerCount.pomodori += json?.pomodori || 0
        this.totalTimerCount.break += json?.break || 0
      }
    }
  },

  methods: {
    onDurationInput () {
      this.modelHours = this.formatNum(this.modelHours)
      this.modelMins = this.formatNum(this.modelMins)
      this.modelSecs = this.formatNum(this.modelSecs)

      const h = parseInt(this.modelHours)
      const m = parseInt(this.modelMins)
      const s = parseInt(this.modelSecs)

      this.totalSecs = h * 60 * 60 + m * 60 + s
      this.timerDuration[this.timerType] = this.totalSecs
      storeJSON('timerDuration', this.timerDuration)
    },

    toggleTimer () {
      // const audioTick = this.$refs.audioTick as HTMLAudioElement
      // audioTick.play()

      if (this.timerId) {
        this.pauseTimer()
      } else {
        this.startTimer()
      }
    },

    startTimer () {
      this.timerId = setInterval(() => {
        if (this.totalSecs) {
          this.totalSecs--
        } else {
          this.timerFinished()
          this.pauseTimer()
        }
      }, 1000)
    },

    pauseTimer () {
      clearInterval(this.timerId)
      this.timerId = undefined
    },

    resetTimer () {
      this.pauseTimer()
      this.totalSecs = this.timerDuration[this.timerType]
    },

    skipTimer () {
      this.timerType = this.timerType === 'pomodori' ? 'break' : 'pomodori'
    },

    tickTimer () {
      if (this.totalSecs) {
        this.totalSecs--
      } else {
        this.toggleTimer()
      }
    },

    async togglePiP () {
      if (this.screenStream) {
        this.stopPiP()
      } else {
        this.startPiP()
      }
    },

    async startPiP () {
      const video = this.$refs.screenVideo as HTMLVideoElement
      // @ts-ignore
      // video.autoPictureInPicture = true

      // @ts-ignore
      this.screenStream = await navigator.mediaDevices.getDisplayMedia({ preferCurrentTab: true, audio: false })
      video.srcObject = this.screenStream

      // @ts-ignore
      video.onloadedmetadata = () => video.requestPictureInPicture()

      // @ts-ignore
      video.onleavepictureinpicture = this.screenStream.oninactive = () => {
        if (this.screenStream) {
          this.screenStream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
        }
        // @ts-ignore
        document.exitPictureInPicture()
      }
    },

    async stopPiP () {
      // @ts-ignore
      if (document.pictureInPictureElement) {
        // @ts-ignore
        document.exitPictureInPicture()
      }
      if (this.screenStream) {
        this.screenStream.getTracks().forEach((track: MediaStreamTrack) => track.stop())
      }

      const video = this.$refs.screenVideo as HTMLVideoElement
      video.srcObject = null
    },

    timerFinished () {
      this.todayTimerCount[this.timerType]++
      this.totalTimerCount[this.timerType]++

      storeJSON(`timerCount-${this.today()}`, this.todayTimerCount)
      this.skipTimer()
    },

    secsTo (output: 'h' | 'm' | 's'): number {
      if (output === 'h') {
        return Math.floor(this.totalSecs / 60 / 60)
      }
      if (output === 'm') {
        return Math.floor(this.totalSecs / 60 % 60)
      }
      return Math.floor(this.totalSecs % 60)
    },

    formatNum (num: string) {
      num = (parseInt(num) || 0).toString()
      return ('00' + num).slice(-2)
    },

    today () {
      return new Date().toISOString().split('T')[0]
    }
  }
})
</script>

<style lang="scss">
* {
  padding: 0;
  margin: 0;
  font: inherit;
  box-sizing: border-box;
  color: inherit;
  border: none;
  outline: none;
  background-color: transparent;
}

b {
  font-weight: bold;
}

button {
  cursor: pointer;
}

html {
  font-size: min(2.5vw, 3vh);
}

.app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #fff;
  display: grid;
  place-items: center;
  width: 100%;
  height: 100vh;
  font-size: 1.6rem;
  color: white;
  position: relative;
  transition: .5s background-color;

  &.pomodori {
    background-color: rgb(49, 146, 98);
  }
  &.break {
    background-color: rgb(52, 124, 121);
  }

  &.timer-active {
    &.pomodori {
      background-color: rgb(105, 35, 30);
    }
    &.break {
      background-color: rgb(68, 46, 168);
    }
  }
}

.pip-button {
  width: 4rem;
  height: 4rem;
  display: grid;
  place-items: center;
  position: absolute;
  top: 1rem;
  right: 1rem;
  background-color: black;
  border-radius: 50%;
}

.container {
  width: min(100%, 35rem);
  height: 90vh;
  padding: 2.0rem 2.0rem;
  display: flex;
  flex-direction: column;
  gap: 1.0rem;
}

.timer {
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 7.0rem;
  font-weight: bold;

  input {
    width: 1.1em;
    font-size: 12rem;
    border: none;
    &:focus {
      outline: .2rem solid #fa0a;
    }
  }
}

.timer-details {
  display: flex;
  flex-direction: column;
  gap: 1.0rem;

  input {
    font-size: 2rem;
    font-weight: bold;
    background-color: #fff;
    border-radius: .3rem;
    max-width: 100%;
    padding: 1.0rem;
    color: rgb(8, 24, 16);
  }

  &.break {
    div {
      text-align: center;
      font-size: 3rem;
      padding: .7rem 0;
    }
  }
}

.timer-btns {
  width: 100%;
  display: flex;
  font-weight: bold;
  color: rgb(48, 48, 48);

  :first-child {
    border-top-left-radius: .3rem;
    border-bottom-left-radius: .3rem;
  }

  :last-child {
    border-top-right-radius: .3rem;
    border-bottom-right-radius: .3rem;
  }

  > * {
    flex: 1;
    text-transform: uppercase;
    font-size: 2.0rem;
    padding: 1.0rem 2.0rem;
    border: none;
  }

  .toggle-timer {
    background-color: rgb(159, 255, 80);
  }

  .reset-timer {
    background-color: rgb(255, 206, 100);
  }

  .skip-timer {
    background-color: rgb(252, 143, 143);
  }
}

.stats {
  display: flex;
  flex-direction: column;
  gap: .6rem;

  .title {
    font-size: 3.0rem;
  }

}
</style>
