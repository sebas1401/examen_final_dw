const { ZodError } = require('zod');

function errorHandler(err, req, res, next) {
  let status = err.status || 500;
  let message = err.message || 'Error interno del servidor';

  if (err instanceof ZodError) {
    status = 400;
    const issue = err.issues?.[0];
    if (issue) {
      const field = issue.path?.length ? issue.path.join('.') : 'campo';
      message = `Error de validación en "${field}": ${issue.message}`;
    } else {
      message = 'Datos proporcionados inválidos';
    }
  }

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(err);
  }

  res.status(status).json({ error: message });
}

module.exports = errorHandler;
