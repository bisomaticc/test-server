// Local development entry point
// Usage: node dev.js
// Requires a .env file with MONGO_URI_MONGODB_MONGODB_URI and MAIL_PASS
require("dotenv").config();

const app = require("./server");
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`✅ Local dev server running at http://localhost:${PORT}`);
  console.log(`   CORS origin: https://www.sareesanskriti.com`);
  console.log(`   MongoDB URI: ${process.env.MONGO_URI_MONGODB_MONGODB_URI ? "✅ set" : "❌ NOT SET"}`);
  console.log(`   Mail pass:   ${process.env.MAIL_PASS ? "✅ set" : "❌ NOT SET"}`);
});
