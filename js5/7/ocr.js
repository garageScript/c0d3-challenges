const Tesseract = require("tesseract.js")
const { v4: uuidv4 } = require("uuid")
const fs = require("fs")

const FILE_LIFETIME = 1000 * 60 * 10 // 10 minutes
const jobs = {}

const deleteOldFiles = () => {
  if (Object.keys(jobs).length > 0) {
    const maxTime = Date.now() - FILE_LIFETIME
    console.log(`${new Date().toString()} ocr: checking for old files`)
    Object.entries(jobs).forEach(([id, job]) => {
      if (job.done && job.timestamp < maxTime) {
        fs.unlink(`${__dirname}/${job.path}`, () => {
          console.log(`${new Date().toString()} ocr: deleted file ${job.filename}`)
          delete jobs[id]
        })
      }
    })
  }
  setTimeout(deleteOldFiles, FILE_LIFETIME)
}

const postJob = (req, res) => {
  const path = req.file.path
  const filename = req.file.filename
  const id = uuidv4()
  const job = { path, filename, done: false, timestamp: Date.now() }
  jobs[id] = job
  console.log(`${new Date().toString()} ocr: new job (id ${id}; file ${filename})`)
  Tesseract.recognize(path, "eng")
  .then(({ data: { text } }) => {
    console.log(`${new Date().toString()} ocr: job ${id} done in ${(Date.now() - job.timestamp) / 1000} s`)
    job.text = text
    job.done = true
  })
  setTimeout(deleteOldFiles, FILE_LIFETIME)
  return res.status(202).redirect(`/ocr/job/${id}`)
}

const getJob = (req, res) => {
  const job = jobs[req.params.jobid]
  if (!job) return res.status(404).json({ error: "Job not found" })
  res.json(job)
}

module.exports = {
  postJob,
  getJob,
}
