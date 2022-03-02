<template>
  <div class="app" :class="{
      'timer-active': timerId,
      'pomodori': timerType === 'pomodori',
      'break': timerType === 'break',
    }">
    <!-- <audio
      src="/public/tick.mp3"
      ref="audioTick"
      id="audioTick"
      crossorigin="anonymous"
    /> -->
    <div class="container">
      <div class="timer">
        <input @input="onDurationInput" type="text" v-model="modelHours">
        <div class="sep">:</div>
        <input @input="onDurationInput" type="text" v-model="modelMins">
        <div class="sep">:</div>
        <input @input="onDurationInput" type="text" v-model="modelSecs">
      </div>

      <div class="timer-details" v-if="timerType === 'pomodori'">
        <div>What do you plan to do in this pomodori?</div>
        <input type="text" v-model="taskDescription">
      </div>

      <div class="timer-details break" v-else>
        <div>It is break time.</div>
        <input type="text" v-model="taskDescription">
      </div>

      <div class="timer-btns">
        <button class="toggle-timer" @click="toggleTimer">
          <span v-if="!this.timerId">Start</span>
          <span v-else>Stop</span>
        </button>
        <button class="reset-timer" @click="resetTimer">Reset</button>
        <button class="skip-timer" @click="skipTimer">Skip</button>
      </div>

      <div class="stats">
        <span class="title">Stats</span>
        <div><b>{{ todayTimerCount['pomodori'] }}</b> pomodori today</div>
        <div><b>{{ todayTimerCount['break'] }}</b> breaks today</div>
        <br>
        <div><b>{{ totalTimerCount['pomodori'] }}</b> pomodori in total</div>
        <div><b>{{ totalTimerCount['break'] }}</b> breaks in total</div>
      </div>
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
      modelHours: '00',
      modelMins: '00',
      modelSecs: '00',
      totalSecs: 0,
      taskDescription: '',
      timerId: undefined as number | undefined
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
}

b {
  font-weight: bold;
}

button {
  cursor: pointer;
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
  font-size: 16px;
  color: white;
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

.container {
  width: min(100%, 350px);
  height: 90vh;
  padding: 20px 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.timer {
  display: flex;
  justify-content: center;
  font-size: 70px;
  font-weight: bold;

  input {
    width: 1.1em;
    font-size: 70px;
    border: none;
    background-color: transparent;
    &:focus {
      outline: 2px solid #fa0a;
    }
  }
}

.timer-details {
  display: flex;
  flex-direction: column;
  gap: 10px;

  input {
    border-radius: 3px;
    max-width: 100%;
    padding: 10px;
    color: rgb(8, 24, 16);
  }

  &.break {
    input {
      visibility: hidden;
    }
  }
}

.timer-btns {
  width: 100%;
  display: flex;
  font-weight: bold;
  color: rgb(48, 48, 48);

  :first-child {
    border-top-left-radius: 3px;
    border-bottom-left-radius: 3px;
  }

  :last-child {
    border-top-right-radius: 3px;
    border-bottom-right-radius: 3px;
  }

  > * {
    flex: 1;
    text-transform: uppercase;
    font-size: 20px;
    padding: 10px 20px;
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
  gap: 6px;

  .title {
    font-size: 30px;
  }

}
</style>
