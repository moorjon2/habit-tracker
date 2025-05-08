const errorHandler = (error, request, response, next) => {
    console.error(error.message);

    if (error.name === 'CastError') {
        return response.status(400).json({ error: 'malformatted id' });
    }

    if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message });
    }

    next(error); // pass to default Express error handler if unhandled
};

module.exports = errorHandler;
