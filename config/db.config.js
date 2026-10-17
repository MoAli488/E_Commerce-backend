const mongoose = require("mongoose");

export async function connectDB() {
  try {
    const mongoURI =
      process.env.NODE_ENV === "DEV"
        ? process.env.MONGO_URI + "_test"
        : process.env.MONGO_URI;
    const myConnection = await mongoose.connect(mongoURI);
    console.log(`DB connected on ${myConnection.connection.host}`);
  } catch (err) {
    console.log(`Error while connecting to DB: ${err}`);
    process.exit(1);
  }
}
