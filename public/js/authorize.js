/* global TrelloPowerUp */


var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var templateBoardId_input = document.getElementById('templateBoardId');
var templateListName_input = document.getElementById('templateListName');

var statusTextSpan = document.getElementById('statusText');
var authDiv = document.getElementById('auth');
var authNode = document.getElementById('authNode');
var deauth = document.getElementById('deauth');

t.render(function(){
  t.organization('boards').then(function(r) { console.log(r) })
  return Promise.all([
    t.get('board', 'shared', 'template'),
    t.board('id').get('id'),
  ])
  .spread(function(template, model){
    deauth.href="https://living-slash.glitch.me/auth?model="+model+"#deauth";

    if(template){
      templateBoardId_input.value = template.boardId;
      templateListName_input.value = template.listName
    }
  })
  .then(function(){
    
    t.sizeTo('#content')
    .done();
  })
});






document.getElementById('save').addEventListener('click', function(){
  

  return t.set('board', 'shared', 'template', {
    boardId : templateBoardId_input.value,
    listName: templateListName_input.value 
  })
  .then(function(){
    return Promise.all([
      t.board('id').get('id'),
      t.get('board', 'shared', 'template')
    ])
      
  })
  .spread(function(model, template){
    console.log("hello")
    authNode.style.display = "block";

    authNode.href="https://living-slash.glitch.me/auth?template_board_id="+template.boardId+"&template_list_name="+template.listName+"&model="+model;
    t.sizeTo('#content')
    })

})