import express from "express";
import { getBooks, getBook, createBook } from "./books/bookController";

const router = express.Router();

// GET /books
router.get("/", getBooks);

// GET /books/:id
router.get("/:id", getBook);

// POST /books
router.post("/", createBook);

export default router;
