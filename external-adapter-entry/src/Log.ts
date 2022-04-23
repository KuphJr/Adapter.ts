import process from 'process'

type LogFunction = (message: string) => void

export class Log {
  static warn: LogFunction = (item) =>
    console.log('⚠️ Warning: ' + item.toString())

  static error: LogFunction = (item) =>
    console.log('🛑 Error: ' + item.toString())

  static info: LogFunction = (item) => {
    if (process.env.LOGGING)
      console.log('💬 Info: ' + item.toString())
  }

  static debug: LogFunction = (item) => {
    if (process.env.LOGGING === 'debug')
      console.log('🐞 Debug: ' + item.toString())
  }
}