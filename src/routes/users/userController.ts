import express, { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import Joi from "joi";
import { Borrow, User } from "../types";
const prisma = new PrismaClient();

// GET /users
export const getUsers = async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
      },
    });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /users/:id
export const getUser = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.id);

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        borrows: {
          include: {
            book: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    const pastBooks = user.borrows
      .filter((borrow: any) => borrow.returnDate !== null)
      .map((borrow: any) => ({
        name: borrow.book.name,
        userScore: borrow.userScore,
      }));

    const presentBooks = user.borrows
      .filter((borrow: any) => borrow.returnDate === null)
      .map((borrow: any) => ({
        id: borrow.bookId,
        name: borrow.book.name,
      }));

    const formattedUser = {
      id: user.id,
      name: user.name,
      books: {
        past: pastBooks,
        present: presentBooks,
      },
    };

    res.json(formattedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /users
export const createUser = async (req: Request, res: Response) => {
  // 1. Validate the request body
  const schema = Joi.object({
    name: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // 2. Extract the user data from the validated request body
  const { name } = req.body;

  try {
    // 3. Create the new user in the database
    const newUser = await prisma.user.create({
      data: {
        name,
      },
    });

    res.status(201).json(newUser); // Return the created user
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// ... other imports

// POST /users/:userId/borrow/:bookId
export const borrowBook = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const bookId = parseInt(req.params.bookId);

  try {
    // 1. Check if the user and book exist
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const book = await prisma.book.findUnique({ where: { id: bookId } });

    if (!user || !book) {
      return res.status(404).json({ error: "User or book not found" });
    }

    // 2. Check if the book is already borrowed
    const existingBorrow = await prisma.borrow.findFirst({
      where: { bookId, returnDate: null }, // Check for active borrows
    });

    if (existingBorrow) {
      return res.status(400).json({ error: "Book is already borrowed" });
    }

    // 3. Create a new borrow record
    await prisma.borrow.create({
      data: {
        user: { connect: { id: userId } },
        book: { connect: { id: bookId } },
      },
    });

    res.status(204).send(); // 204 No Content on success
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /users/:userId/return/:bookId
export const returnBook = async (req: Request, res: Response) => {
  const userId = parseInt(req.params.userId);
  const bookId = parseInt(req.params.bookId);

  // 1. Validate the request body (assuming you're sending the score in the body)
  const schema = Joi.object({
    score: Joi.number().integer().min(1).max(10).required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  const { score } = req.body;

  try {
    // 2. Find the active borrow record for this user and book
    const borrowRecord = await prisma.borrow.findFirst({
      where: { userId, bookId, returnDate: null },
    });

    if (!borrowRecord) {
      return res.status(404).json({ error: "Active borrow record not found" });
    }

    // 3. Update the borrow record with the return date and score
    await prisma.borrow.update({
      where: { id: borrowRecord.id },
      data: {
        returnDate: new Date(),
        userScore: score,
      },
    });

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
