/* global TrelloPowerUp */
var Promise = TrelloPowerUp.Promise;
var t = TrelloPowerUp.iframe();


var textP = document.getElementById('text');

t.render(function(){
  
  t.get('board', 'shared', "auth")
  .then(function(auth){
    textP.innerHTML += "PowerUp settings managed by "+auth.member.fullName
  })
    

  .then(function(){
    t.sizeTo('#content')
    .done();
  })
        
  });

