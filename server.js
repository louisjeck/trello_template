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

var _ = require('underscore')
// compress our client side content before sending it over the wire
app.use(compression());

// your manifest must have appropriate CORS headers, you could also use '*'
app.use(cors({ origin: 'https://trello.com' }));
app.use( bodyParser.json() );
app.use(express.static('public'));



app.engine('.html', require('ejs').renderFile);
app.get("/auth", function(req, res){
    
    res.render("auth.html", { templateBoardId: req.query.template_board_id, templateListName: req.query.template_list_name, webhookModel : req.query.model });
});


var t


function deleteWebhook(res){
  console.log('Refused webhook')
  res.status(410);
  res.end();
  return true;
}

function checkDisableWebhook(req, res){
  var action = req.body.action;
  if (action.type == "disablePlugin" && action.data.plugin.url == "https://"+req.headers.host+"/manifest.json")
    return deleteWebhook(res)
  return false
  
}

app.all("/webhooks", function(req, res) {

  
  res.setHeader('Content-Type', 'text')
  if(req.body.action === undefined) {
    res.end()
    return
  }
  if(checkDisableWebhook(req, res))
    return;
  var type = req.body.action.display.translationKey
  //console.log(req.body.action)
  if(type == "action_move_card_from_list_to_list" || type == "action_create_card" || type == "action_add_attachment_to_card"){
    console.log('-------------------------')
    console.log('type handle : ', type)
    handleCreateUpdateCard(req)
  }
  res.end()
  
  
  
})


function handleCreateUpdateCard(req){
  console.log('token', req.query.token)
  t = new Trello('910aeb0b23c2e63299f8fb460f9bda36', req.query.token) //req.query.token)

  handleGlobalBoardAction(req)
  .then(function(){
    handleSingleCardAction(req)
  })
  
}

function handleSingleCardAction(req){
  //checks if a card has a link pointing to a board, if so look for template lists
  console.log('single card')
  
  var action = req.body.action
  var data = action.data
  var card = data.card
  var destBoardName = data.board.name
  return getAttachmentURLs(card)
  .then(function(urls){
    return getBoardIdFromURLs(urls)
    
  }).then(function(boardId){
    return getListIdFromListName(boardId, destBoardName) 

  }).then(function(sourceListId){
    return syncChecklistFromBoard(action, sourceListId)
    
  }).catch(function(err){
    console.log(err)
  })

}





function handleGlobalBoardAction(req){
  var action = req.body.action
  var boardId = req.query.templateBoardId
  var listName = req.query.templateListName
  var data = action.data


  var destCardId = data.card.id
  var sourceListName = listName == '' ? data.board.name : listName
  var boardId = boardId == '' ? data.board.id : boardId
  
  return getListIdFromListName(boardId, sourceListName)
  
  .then(function(sourceListId){
    return syncChecklistFromBoard(action, sourceListId)
    
  })

}


function syncChecklistFromBoard(action, sourceListId) {
  var data = action.data
  var destCardId = data.card.id
  
  if (typeof(data.list) !== 'undefined')
    var destListName = data.list.name
    
  else if(action.type == 'updateCard' && typeof(data.listAfter) !== 'undefined')
    var destListName = data.listAfter.name
  
  else {
    console.error("List name not found")
    return;
  }

  
  return getCardIdFromCardName(sourceListId, destListName)
  
  .then(function(sourceCardId){ 
    return Promise.all([
        getChecklistsList(sourceCardId),
        getChecklistsList(destCardId)
    ])     
  })
  
  .spread(function(sourceChecklistsList, destChecklistsList){
    var destChecklistsNames = _.pluck(destChecklistsList, 'name')
    sourceChecklistsList.forEach(function(checklist){
      if(destChecklistsNames.indexOf(checklist.name) === -1)
        copyChecklist(checklist.id, data.card.id)
    })
    
  })
  
  .catch(function(e){
    console.log(e)
  })
  
  
}



function copyChecklist(idChecklistSource, destCard){
  console.log("Copying ", idChecklistSource, "to ", destCard)
  
  return new Promise(function(resolve, reject){  
    t.post("/1/checklists/", {idChecklistSource : idChecklistSource, idCard : destCard, pos : 'top' }, function(err, data){
      if(err) return reject(err)
      resolve()
    })
    
  })
}

function getListIdFromListName(boardId, listName){
  return new Promise(function(resolve, reject){  
    if(boardId === undefined) return reject('boardId not found')
    var listId;
    
    t.get("/1/boards/"+boardId+"/lists/", function(err, lists){  
      if(err) return reject(err)
      
      lists.forEach(function(list){  
        if(list.name == listName)
          listId = list.id       
      })
      console.log('resolve getListId')
      resolve(listId)     
    }) 
    
  })
}


function getCardIdFromCardName(listId, cardName){
  return new Promise(function(resolve, reject){
    if(listId === undefined) return reject('list not found')
    var cardId;
    
    t.get("/1/lists/"+listId+"/cards/", function(err, cards){  
      cards.forEach(function(card){    
        if(card.name == cardName)
          cardId = card.id
      }) 
      if(cardId === undefined) 
        return reject("card " + cardName + " not found in list " + listId)
      resolve(cardId)     
    }) 
  })
}


function getChecklistsList(cardId){
  return new Promise(function(resolve, reject){
    t.get("/1/cards/"+cardId+"/checklists", function(err, checklists){
      if(err) 
        return reject(err)
      resolve(checklists)
      
    })
  
  })
}



function getBoardIdFromURLs(urls){
  var re = new RegExp("https://trello.com/b/(.*?)/")

  for (var url of urls){
    var board = re.exec(url)
    if(board !== null)
      return board[1]   
  }  
}

function getAttachmentURLs(card){

  return new Promise(function(resolve, reject){
    t.get("/1/cards/"+card.id+"/attachments", {fields : 'url' }, function(err, attachments){   
      if(err) return reject(err)
      resolve(_.pluck(attachments, 'url'))  
    })
  })
 
}




// listen for requests 
var listener = app.listen(process.env.PORT, function () {
  console.info(`Node Version: ${process.version}`);
  console.log('Trello Power-Up Server listening on port ' + listener.address().port);
});

