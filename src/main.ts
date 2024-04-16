import express, { Request, Response } from "express"
import morgan from "morgan"
import "express-async-errors"
import { getConnection } from './db'
import mysql from 'mysql2/promise'
import { Board, Square } from './types'

const PORT = 3000
const app = express()

app.use(morgan("dev"))
app.use(express.static("static", { extensions: ["html"] }))

const errorHandler = (err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
	console.error("Unexpected error", err)
	res.status(500).json({
		message: "Unexpected error",
	})
}

const EMPTY = 0
const DARK = 1
const LIGHT = 2

const INITIAL_BOARD: Board = [
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, DARK, LIGHT, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, LIGHT, DARK, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
	[EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY, EMPTY],
]

const generateSquareInsertValues = (board: Board, turnId: number): Square[] => {
	const squaresInsertValues: Square[] = []

	board.forEach((line, y) => {
		line.forEach((disc, x) => {
			squaresInsertValues.push(turnId)
			squaresInsertValues.push(x)
			squaresInsertValues.push(y)
			squaresInsertValues.push(disc)
		})
	})

	return squaresInsertValues
}

app.get("/api/hello", async (_: Request, res: Response) => {
	res.json({
		message: "Hello World",
	})
})

app.get("/api/error", async () => {
	throw new Error("Unexpected error")
})

app.post("/api/games", async (req: Request, res: Response) => {
	const now = new Date()
	const conn = await getConnection()


	try {
		await conn.beginTransaction()

		const gameInsertResult = await conn.execute<mysql.ResultSetHeader>(
			'insert into games (started_at) values (?)',
			[now]
		)

		const gameId = gameInsertResult[0].insertId
		const turnInsertResult = await conn.execute<mysql.ResultSetHeader>(
			'insert into turns (game_id, turn_count, next_disc, end_at) values (?, ?, ?, ?)',
			[gameId, 0, DARK, now]
		)

		const turnId = turnInsertResult[0].insertId
		const squareCount = INITIAL_BOARD.map((line) => line.length).reduce(
			(acc, cur) => acc + cur,
			0
		)

		const squaresInsertSql =
			'insert into squares (turn_id, x, y, disc) values ' +
			Array.from(Array(squareCount)).map(() => '(?, ?, ?, ?)').join(', ')

		const squaresInsertValues = generateSquareInsertValues(INITIAL_BOARD, turnId)
		await conn.execute(squaresInsertSql, squaresInsertValues)

		await conn.commit()
	} finally {
		await conn.end()
	}

	res.status(201).end()
})

app.use(errorHandler)

app.listen(PORT, () => {
	console.log(`Server is running on http://localhost:${PORT}`)
})
