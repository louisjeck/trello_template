/* global TrelloPowerUp */


var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();

var templateBoardId_input = document.getElementById('templateBoardId');
var templateListName_input = document.getElementById('templateListName');


var authDiv = document.getElementById('auth');
var authNode = document.getElementById('authNode');
var unlink = document.getElementById('unlink');

t.render(function(){
  t.organization('boards').then(function(r) { console.log(r) })
  return Promise.all([
    t.get('board', 'shared', 'template'),
    t.board('id').get('id'),
  ])
  .spread(function(template, model){

    if(template){
      templateBoardId_input.value = template.boardId;
      templateListName_input.value = template.listName

    }
  })
  .then(function(){
    
    t.sizeTo('#content')

  })
});

function done(token){
  console.log('token', token)
  Promise.all([
  t.board('id').get('id'),
  t.member('fullName', 'id')
  ])
  .spread(function(boardId, member){

  t.set('board', 'shared', 'auth', {
       member : member,
       boardId : boardId
  });
    

})
}


function clean(){
  console.log('clean')
  t.remove('board', 'shared', 'auth')
}

unlink.addEventListener('click', function(e){
  t.board('id').get('id')
  .then(function(boardId){
    window.open("https://living-slash.glitch.me/auth?model="+boardId+"#deauth")
  })
})

authNode.addEventListener('click', function(e){
  e.preventDefault();

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
    window.open("https://living-slash.glitch.me/auth?template_board_id="+template.boardId+"&template_list_name="+template.listName+"&model="+model, '_blank')
    t.sizeTo('#content')
    })

})