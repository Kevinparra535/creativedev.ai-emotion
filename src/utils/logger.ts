/**
 * Logger class for logging messages with different types.
 */
class Logger {
  private layer: string;

  private colorMap: { [key: string]: string } = {
    info: 'color: blue',
    error: 'color: red',
    debug: 'color: green',
    warn: 'color: orange'
  };

  constructor(layer: string) {
    this.layer = layer;
  }

  private log(message: string, type: 'info' | 'error' | 'debug' | 'warn') {
    console.log(`%c[${this.layer}] ${message}`, this.colorMap[type]);
  }

  info(message: string) {
    this.log(message, 'info');
  }

  error(message: string) {
    this.log(message, 'error');
  }

  debug(message: string) {
    this.log(message, 'debug');
  }

  warn(message: string) {
    this.log(message, 'warn');
  }
}

export default Logger;
