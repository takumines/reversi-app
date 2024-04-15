import express, { Request, Response } from "express"
import morgan from "morgan"
import "express-async-errors"

const PORT = 3000

const app = express()

app.use(morgan("dev"))

const errorHandler = (err: Error, _req: Request, res: Response, _next: express.NextFunction) => {
  console.error("Unexpected error", err)
  res.status(500).json({
    message: "Unexpected error",
  })
}

app.get("/api/hello", async (_: Request, res: Response) => {
  res.json({
    message: "Hello World",
  })
})

app.get("/api/error", async () => {
  throw new Error("Unexpected error")
})

app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
