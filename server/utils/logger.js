const logger = {
  info: (msg) => console.log(`[INFO] ${msg}`),
  error: (msg, err) => {
    console.error(`[ERROR] ${msg}`);
    if (err) {
      console.error(err);
    }
  },
  warn: (msg) => console.warn(`[WARN] ${msg}`)
};

module.exports = logger;
