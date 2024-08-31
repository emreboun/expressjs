import express from "express";
import bodyParser from "body-parser";
import userRouter from "./routes/users";
import bookRouter from "./routes/books";
const app = express();
const port = 3000;

app.use(bodyParser.json());

app.use("/users", userRouter);
app.use("/books", bookRouter);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
