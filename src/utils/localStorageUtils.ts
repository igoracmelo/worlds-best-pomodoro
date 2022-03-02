export const storeJSON = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value))
}

export const loadJSON = <T>(key: string): T => {
  return JSON.parse(localStorage.getItem(key) ?? 'null')
}

export const storeString = (key: string, value: string): void => {
  localStorage.setItem(key, value)
}

export const loadString = (key: string): string | null => {
  return localStorage.getItem(key)
}
