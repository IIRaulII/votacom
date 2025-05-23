class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // Capturar la traza de error
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ErrorHandler; 