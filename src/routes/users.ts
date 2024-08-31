import express from "express";
import {
  getUsers,
  getUser,
  createUser,
  borrowBook,
  returnBook,
} from "./users/userController";
const router = express.Router();

// GET /users
router.get("/", getUsers);

// GET /users/:id
router.get("/:id", getUser);

// POST /users
router.post("/", createUser);

// POST /users/:userId/borrow/:bookId
router.post("/:userId/borrow/:bookId", borrowBook);

// POST /users/:userId/return/:bookId
router.post("/:userId/return/:bookId", returnBook);

export default router;
