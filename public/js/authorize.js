/* global TrelloPowerUp */


var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var templateBoardId_input = document.getElementById('templateBoardId');
var templateListId_input = document.getElementById('templateListId');

var statusTextSpan = document.getElementById('statusText');
var authDiv = document.getElementById('auth');
var authNode = document.getElementById('authNode');

t.render(function(){
  t.organization('boards').then(function(r) { console.log(r) })
  return Promise.all([
    t.get('board', 'shared', 'template'),
  ])
  .spread(function(template){
    if(template){
      templateBoardId_input.value = template.boardId;
      templateListId_input.value = template.applistId
    }
  })
  .then(function(){
    t.sizeTo('#content')
    .done();
  })
});






document.getElementById('save').addEventListener('click', function(){
  

  return t.set('board', 'shared', 'template', {boardId : templateBoardId_input.value, applistId: templateListId_input.value } )
  .then(function(){
    return Promise.all([
      t.board('id').get('id'),
      t.get('board', 'shared', 'template')
    ])
      
  })
  .spread(function(model, template){
    console.log("hello")
    authNode.style.display = "block";
    authNode.href="https://living-slash.glitch.me/auth?template_board_id="+template.boardId+"&model="+model;
    t.sizeTo('#content')
    })

})