import process from 'process'

export const log = (itemToLog: any): void => {
  if (process.env.LOGGING) {
    console.log(itemToLog)
  }
}