import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { Book, Borrow } from "../types";
import Joi from "joi";

const prisma = new PrismaClient();

// GET /books
export const getBooks = async (req: Request, res: Response) => {
  try {
    const books = await prisma.book.findMany();
    res.json(books);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// GET /books/:id
export const getBook = async (req: Request, res: Response) => {
  const bookId = parseInt(req.params.id);

  try {
    // TODO: add prisma queryRaw to get avg score
    const bookWithAverageScore = await prisma.book.findUnique({
      where: { id: bookId },
      include: {
        borrows: {
          select: {
            userScore: true,
          },
        },
      },
    });

    if (!bookWithAverageScore) {
      return res.status(404).json({ error: "Book not found" });
    }

    const validBorrows = bookWithAverageScore.borrows.filter(
      (borrow: any) =>
        borrow.userScore !== null && borrow.userScore !== undefined
    );

    const averageScore =
      validBorrows.length > 0
        ? validBorrows.reduce(
            (sum: number, borrow: any) => sum + borrow.userScore,
            0
          ) / validBorrows.length
        : -1;

    const book: Book = {
      id: bookWithAverageScore.id,
      name: bookWithAverageScore.name,
      score: Number(averageScore.toFixed(2)),
    };

    res.json(book);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// POST /books
export const createBook = async (req: Request, res: Response) => {
  // 1. Validate the request body
  const schema = Joi.object({
    name: Joi.string().required(),
  });

  const { error } = schema.validate(req.body);
  if (error) {
    return res.status(400).json({ error: error.details[0].message });
  }

  // 2. Extract the book data from the validated request body
  const { name } = req.body;

  try {
    // 3. Create the new book in the database
    const newBook = await prisma.book.create({
      data: {
        name,
      },
    });

    res.status(201).json(newBook);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
