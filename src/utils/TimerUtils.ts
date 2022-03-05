export const secondsTo = (seconds: number, output: 'h' | 'm' | 's'): number => {
  if (output === 'h') {
    return Math.floor(seconds / 60 / 60)
  }
  if (output === 'm') {
    return Math.floor(seconds / 60 % 60)
  }
  return Math.floor(seconds % 60)
}

export const formatTimerNumber = (num: string): string => {
  num = (parseInt(num) || 0).toString()
  return ('00' + num).slice(-2)
}
