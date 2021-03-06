const express = require('express')
const bodyParser = require('body-parser')
const app = express()
var memwatch = require('node-memwatch')

// const http = require('http')
// var https = require('https')
var fs = require('fs')
const tempWrite = require('temp-write')

// var privateKey = fs.readFileSync('./selfsigned.key', 'utf8')
// var certificate = fs.readFileSync('./selfsigned.crt', 'utf8')

// var httpServer = http.Server(app)
// var httpsServer = https.Server(credentials, app)

//var credentials = { key: privateKey, cert: certificate }
const helmet = require('helmet')
const { execFile, exec, spawn } = require('child_process')
const queue = require('express-queue')

app.use(helmet())
app.use(bodyParser.json({ limit: '10mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }))

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Credentials', 'true')
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,OPTIONS,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization'
  )
  next()
})

//pre-flight requests
app.options('*', function(req, res) {
  res.send(200)
})

// httpServer.listen(3000, err => {
//   if (err) {
//     throw err
//   }
//   /* eslint-disable no-console */
//   console.log('server running')
// })

app.listen(3000, err => {
  if (err) {
    throw err
  }
  /* eslint-disable no-console */
  console.log('server running')
})

app.get('/', (req, res) => {
  res.status(200)
  res.json({ hello: 'hi' })
  res.end()
})

// const darknet = spawn('./darknet', [
//   `classifier`,
//   `one_label`,
//   `cfg/imagenet1k.data`,
//   `cfg/darknet19.cfg`,
//   `darknet19.weights`,
//   150
// ])

app.use(queue({ activeLimit: 1, queuedLimit: -1 }))

var pty = require('node-pty')

memwatch.on('leak', info => {
  console.error('Memory leak detected:\n', info)
})

var ptyProcess = pty.spawn('bash', [], {
  name: 'xterm-color',
  cols: 80,
  rows: 30,
  cwd: '.',
  env: process.env
})

ptyProcess.write(
  './darknet classifier one_label cfg/imagenet1k.data cfg/darknet19.cfg darknet19.weights 150\r'
)

var respond = () => {}

ptyProcess.on('data', function(data) {
  process.stdout.write(data)
  if (data.match(/([0-9]*\.[0-9]*)/g)) {
    respond(data)
  }
})

function doResponse(res, data, end) {
  //process.stdout.write(data)
  var end = false
}

app.post('/', (req, res) => {
  var id = req.body.id
  var data = req.body.data
  var imgSize = req.body.imgSize

  var filepath = tempWrite.sync(data)

  ptyProcess.write(`${filepath} ${id}\r`)

  var fallbacktimeout = setTimeout(
    () => ptyProcess.write(`${filepath} ${id}\r`),
    3000
  )

  respond = function(ptydata) {
    clearTimeout(fallbacktimeout)
    exec(`rm ${filepath}`)
    res.status(200)
    res.json({ score: ptydata })
    res.end()
  }

  // darknet.stdin.write(id)

  // darknet.stdout.on('data', data => {
  //   res.status(200)
  //   res.json({ score: data.toString() })
  //   res.end()
  // })

  // execFile(
  //   `./darknet`,
  //   [
  //     `classifier`,
  //     `one_label`,
  //     `cfg/imagenet1k.data`,
  //     `cfg/darknet19.cfg`,
  //     `darknet19.weights`,
  //     id,
  //     imgSize,
  //     filepath
  //   ],
  //   (err, stdout, stderr) => {
  //     exec(`rm ${filepath}`)
  //     if (err) {
  //       res.json({ err: err, stderr: stderr })
  //       res.end()
  //     } else {
  //       res.status(200)

  //       console.log(`${id}: ${stdout}`)
  //       res.json({ score: stdout })
  //       res.end()
  //     }
  //   }
  // )
})

// app.post('/predict', (req, res) => {
//   var id = req.body.id
//   var data = req.body.data
//   var imgSize = req.body.imgSize

//   const filepath = tempWrite.sync(data)

//   execFile(
//     `./darknet`,
//     [
//       `classifier`,
//       `predict`,
//       `cfg/imagenet1k.data`,
//       `cfg/darknet19.cfg`,
//       `darknet19.weights`,
//       id,
//       imgSize,
//       filepath
//     ],
//     (err, stdout, stderr) => {
//       exec(`rm ${filepath}`)
//       if (err) {
//         res.json({ err: err, stderr: stderr })
//         res.end()
//       } else {
//         res.status(200)

//         console.log(`${stdout}`)
//         res.json({ score: stdout })
//         res.end()
//       }
//     }
//   )
// })

module.exports = app
