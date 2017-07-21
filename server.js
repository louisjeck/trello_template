// server.js
// where your node app starts

var compression = require('compression');
var cors = require('cors');
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var Trello = require('node-trello');
var Promise = require('bluebird')
var t = new Trello('910aeb0b23c2e63299f8fb460f9bda36', '556ac2c96944fc52ad432c56f944445b0a7682528398e638cf89339f0b13a971')
// https://trello.com/1/connect?key=910aeb0b23c2e63299f8fb460f9bda36&name=Trello+Template&response_type=token&expiration=never&scope=read,write
var _ = require('underscore')
// compress our client side content before sending it over the wire
app.use(compression());

// your manifest must have appropriate CORS headers, you could also use '*'
app.use(cors({ origin: 'https://trello.com' }));
app.use( bodyParser.json() );
app.use(express.static('public'));



app.engine('.html', require('ejs').renderFile);
app.get("/auth", function(req, res){
    
    res.render("auth.html", { templateBoardId: req.query.template_board_id, webhookModel : req.query.model });
});



app.all("/webhooks", function(req, res) {
    
  res.setHeader('Content-Type', 'text')
  var type = req.body.action.type

console.log(req.body.action.data.card)
  if(type == "updateCard" || type == "createCard")
    handleCreateUpdateCard(req)
  res.end()
  
  
  
})


function handleCreateUpdateCard(req){
  console.log("Got webhook call")
  handleGlobalBoardAction(req)
  
  
}

function handleSingleCardAction(req){
  //checks if a card has a link pointing to a board, if so look for template lists
}


function handleGlobalBoardAction(req){
  var action = req.body.action
  var boardId = req.query.templateBoardId
  var data = action.data
  
  var destBoardName = data.board.name
  if (action.type == 'createCard' && typeof(data.list) !== 'undefined')
    var destListName = data.list.name
    
  else if(action.type == 'updateCard' && typeof(data.listAfter) !== 'undefined')
    var destListName = data.listAfter.name
  
  else {
    console.error("List name not found")
    return;
  }
 
    
  var destCardId = data.card.id
  console.log(destBoardName, destListName, destCardId)
    
  getListIdFromListName(boardId, destBoardName) 
  .then(function(sourceListId){
    //console.log("sourceList", sourceListId)
    return getCardIdFromCardName(sourceListId, destListName)
    
  })
  .then(function(sourceCardId){
    //console.log("sourceCard", sourceCardId)

    return [
        getChecklistsList(sourceCardId),
        getChecklistsList(destCardId)
    ]
          
  })
  .spread(function(sourceChecklistsList, destChecklistsList){
    var destChecklistsNames = _.pluck(destChecklistsList, 'name')
    sourceChecklistsList.forEach(function(checklist){

      if(destChecklistsNames.indexOf(checklist.name) === -1)
        
        copyChecklist(checklist.id, data.card.id)
    })

  })
}


function syncChecklistFromBoard(action, sourceListId) {
  var data = action.data
  var destBoardName = data.board.name
  var destCardId = data.card.id
  if (action.type == 'createCard' && typeof(data.list) !== 'undefined')
    var destListName = data.list.name
    
  else if(action.type == 'updateCard' && typeof(data.listAfter) !== 'undefined')
    var destListName = data.listAfter.name
  
  else {
    console.error("List name not found")
    return;
  }
  
  return getCardIdFromCardName(sourceListId, destListName)
    
  
  .then(function(sourceCardId){
    //console.log("sourceCard", sourceCardId)

    return [
        getChecklistsList(sourceCardId),
        getChecklistsList(destCardId)
    ]
          
  })
  .spread(function(sourceChecklistsList, destChecklistsList){
    var destChecklistsNames = _.pluck(destChecklistsList, 'name')
    sourceChecklistsList.forEach(function(checklist){

      if(destChecklistsNames.indexOf(checklist.name) === -1)
        
        copyChecklist(checklist.id, data.card.id)
    })

  })
  
  
}



function copyChecklist(idChecklistSource, destCard){
  console.log("Copying ", idChecklistSource, "to ", destCard)
  return new Promise(function(resolve){
    t.post("/1/checklists/", {idChecklistSource : idChecklistSource, idCard : destCard }, function(err, data){
      resolve()
    })
  })
}

function getListIdFromListName(boardId, listName){
  return new Promise(function(resolve){  
    var listId;
    t.get("/1/boards/"+boardId+"/lists/", function(err, lists){  
      lists.forEach(function(list){  
        if(list.name == listName)
          listId = list.id       
      })  
      resolve(listId)     
    }) 
  })
}


function getCardIdFromCardName(listId, cardName){
  return new Promise(function(resolve){
    
    var cardId;
    
    t.get("/1/lists/"+listId+"/cards/", function(err, cards){  
      cards.forEach(function(card){    
        if(card.name == cardName)
          cardId = card.id
      }) 

      resolve(cardId)     
    }) 
  })
}


function getChecklistsList(cardId){
  return new Promise(function(resolve){
    t.get("/1/cards/"+cardId+"/checklists", function(err, checklists){
      resolve(checklists)
      
    })
  
  })
}



// listen for requests 
var listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log('Trello Power-Up Server listening on port ' + listener.address().port);
});










//***** TRELLO WEBHOOKS MGMT *****//


// Start the request
function createWebhook(model){

  var headers = {
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: "https://api.trello.com/1/tokens/"+TRELLO_USER_TOKEN+"/webhooks/?key="+TRELLO_APPLICATION_KEY,
      method: 'POST',
      headers: headers,
      form: {'idModel': model, 'description' : "AirTable webhook", 'callbackURL' : "https://hypnotic-bay.glitch.me/webhooks"}
  }
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
          console.log(body)
      }
    else console.log(body)
  })

}


function deleteWebhook(webhook){
  
    var headers = {
      'Content-Type':     'application/x-www-form-urlencoded'
  }

  // Configure the request
  var options = {
      url: "https://api.trello.com/1/tokens/"+""+"/webhooks/"+webhook+"?key="+"",
      method: 'DELETE',
      headers: headers,
  }
  request(options, function (error, response, body) {
      if (!error && response.statusCode == 200) {
          // Print out the response body
        console.log("ok")
          console.log(body)
      }
    else console.log(body)
  })
  
}