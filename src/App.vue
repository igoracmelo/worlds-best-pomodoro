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
      <picture-in-picture />
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

<script setup lang="ts">
import { ref, watch } from 'vue'
import PictureInPicture from './components/PictureInPicture.vue'
import { secondsTo, formatTimerNumber } from './utils/TimerUtils'
import { storeJSON, loadJSON, storeString, loadString } from './utils/localStorageUtils'

type TimerType = 'pomodori' | 'break'
type TimerCount = {
  pomodori: number
  break: number
}

// const tickSound = ref(true)
// const timeoutSound = ref(true)
const enableHours = ref(false)
const modelHours = ref('00')
const modelMins = ref('00')
const modelSecs = ref('00')

const timerType = ref((loadString('timerType') || 'pomodori') as TimerType)
watch(timerType, () => {
  storeString('timerType', timerType.value)
  pauseTimer()
  totalSecs.value = timerDuration.value[timerType.value]
})

const taskDescription = ref(loadString('taskDescription') || '')
watch(taskDescription, () => {
  storeString('taskDescription', taskDescription.value)
})

const timerId = ref<number|undefined>(undefined)

const timerDuration = ref<TimerCount>(loadJSON('timerDuration') || {
  pomodori: 25 * 60,
  break: 5 * 60
})

const totalSecs = ref<number>(loadJSON('totalSecs') || timerDuration.value[timerType.value])
watch(totalSecs, updateTimerNumbers)
updateTimerNumbers()

const todayTimerCount = ref<TimerCount>(loadJSON(`timerCount-${today()}`) || {
  pomodori: 0,
  break: 0
})

const totalTimerCount = ref<TimerCount>({
  pomodori: 0,
  break: 0
})

for (let i = 0; i < localStorage.length; i++) {
  const key = localStorage.key(i)
  if (key?.startsWith('timerCount-')) {
    const json = loadJSON(key) as any
    totalTimerCount.value.pomodori += json?.pomodori || 0
    totalTimerCount.value.break += json?.break || 0
  }
}

function updateTimerNumbers () {
  modelHours.value = formatTimerNumber(secondsTo(totalSecs.value, 'h').toString())
  modelMins.value = formatTimerNumber(secondsTo(totalSecs.value, 'm').toString())
  modelSecs.value = formatTimerNumber(secondsTo(totalSecs.value, 's').toString())
}

function startTimer () {
  timerId.value = setInterval(() => {
    if (totalSecs.value) {
      totalSecs.value--
    } else {
      timerFinished()
      pauseTimer()
    }
  }, 1000)
}

function pauseTimer () {
  clearInterval(timerId.value)
  timerId.value = undefined
}

function toggleTimer () {
  // const audioTick = this.$refs.audioTick as HTMLAudioElement
  // audioTick.play()

  if (timerId.value) {
    pauseTimer()
  } else {
    startTimer()
  }
}

function resetTimer () {
  pauseTimer()
  totalSecs.value = timerDuration.value[timerType.value]
}

function skipTimer () {
  timerType.value = timerType.value === 'pomodori' ? 'break' : 'pomodori'
}

function tickTimer () {
  if (totalSecs.value) {
    totalSecs.value--
  } else {
    toggleTimer()
  }
}

function onDurationInput () {
  modelHours.value = formatTimerNumber(modelHours.value)
  modelMins.value = formatTimerNumber(modelMins.value)
  modelSecs.value = formatTimerNumber(modelSecs.value)

  const h = parseInt(modelHours.value)
  const m = parseInt(modelMins.value)
  const s = parseInt(modelSecs.value)

  totalSecs.value = h * 60 * 60 + m * 60 + s
  timerDuration.value[timerType.value] = totalSecs.value
  storeJSON('timerDuration', timerDuration.value)
}

function timerFinished () {
  todayTimerCount.value[timerType.value]++
  totalTimerCount.value[timerType.value]++

  storeJSON(`timerCount-${today()}`, todayTimerCount.value)
  skipTimer()
}

function today () {
  return new Date().toISOString().split('T')[0]
}

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

.picture-in-picture {
  position: absolute;
  top: 1rem;
  right: 1rem;
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
