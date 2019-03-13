const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const server = require('http').Server(app);
const port = 3000;
const helmet = require('helmet');
const { exec } = require('child_process');

app.use(helmet());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
	res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With, Content-Type, Accept');
	next();
});

//pre-flight requests
app.options('*', function(req, res) {
	res.send(200);
});

server.listen(port, (err) => {
	if (err) {
		throw err;
	}
	/* eslint-disable no-console */
	console.log('server running');
});

app.get('/:id/:data', (req, res) => {
	
	exec(`./darknet classifier one_label cfg/imagenet1k.data cfg/darknet19.cfg darknet19.weights ${req.params.id} ${req.params.data}`, (err, stdout, stderr) => {
	  if (err) {
	    res.json({ err: err, stderr: stderr});
	    res.end();
	  }

	  res.status(200);

	  console.log(`${stdout}`);
	  res.json({ score: stdout });
	  res.end();
	});
	
});



module.exports = server;