export class MobileReportsError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = "MobileReportsError"
    this.status = status
  }
}
