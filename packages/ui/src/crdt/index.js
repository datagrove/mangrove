// Copyright 2016 Google Inc. All rights reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// A collaborative text editing server, based on socket.io. You should be able
// to run this as just "node .", followed by connecting clients to
// http://localhost:3000/

var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var ot_toy = require('./ot_toy');
var sleep = require('sleep');

var options = {root: __dirname};
app.get('/', function(req, res){
    res.sendFile('index.html', options);
});

app.get('/ot_toy.js', function(req, res){
    res.sendFile('ot_toy.js', options);
});

var docState = new ot_toy.DocState();

var rev = 0;
function broadcast() {
    if (rev < docState.ops.length) {
        //sleep.sleep(1);  // disable for good performance, enable to simulate lag
        io.emit('update', docState.ops.slice(rev));
        rev = docState.ops.length;
    }
}

io.on('connection', function(socket){
    var peer = new ot_toy.Peer();
    console.log('client connected');
    socket.on('update', function(ops) {
        for (var i = 0; i < ops.length; i++) {
            peer.merge_op(docState, ops[i]);
        }
        broadcast();
        console.log('update: ' + JSON.stringify(ops) + ": " + docState.get_str());
    });
    socket.emit('update', docState.ops);
});

http.listen(3600, function(){
  console.log('Connect your client to http://localhost:3600/');
});