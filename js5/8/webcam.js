const fs = require("fs")
const path = require("path")
const { v4: uuidv4 } = require("uuid")

const FILE_LIFETIME = 1000 * 60 * 10 // 10 minutes
const files = {}

const dir = path.resolve("./public")

// Create files folder if it not exists
!fs.existsSync(dir + '/files') && fs.mkdirSync(dir + '/files', {recursive: true});

console.log(`${new Date().toString()} webcam: dir resolved to ${dir}`)

const deleteOldFiles = () => {
  if (Object.keys(files).length > 0) {
    const maxTime = Date.now() - FILE_LIFETIME
    console.log(`${new Date().toString()} webcam: checking for old files`)
    Object.entries(files).forEach(([id, file]) => {
      if (file.timestamp < maxTime) {
        fs.unlink(file.path, () => {
          console.log(`${new Date().toString()} webcam: deleted file ${file.path}`)
          delete files[id]
        })
      }
    })
  }
  setTimeout(deleteOldFiles, FILE_LIFETIME)
}

const postImage = (req, res) => {
  const img = req.body.img
  const id = uuidv4()
  const imgURL = `/files/${id}.png`
  const imgPath = dir + imgURL
  fs.writeFile(imgPath, img, "base64", (err) => {
    if (err) return res.status(500).json({ error: err })
    console.log(`${new Date().toString()} webcam: written image to ${imgPath}`)
    files[id] = {
      path: imgPath,
      timestamp: Date.now(),
    }
    res.status(201).json({ url: imgURL })
  })
}

module.exports = {
  postImage,
  deleteOldFiles
}
