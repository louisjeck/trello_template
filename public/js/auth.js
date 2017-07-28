
$(document).ready(function(){

  var p = document.getElementById('p');
  var status = document.getElementById('status')
  
  function clearWebhooks(){
    return   getWebhooks()
  .then(function(webhooks){
    console.log(webhooks)
    var pro = [];
    webhooks.forEach(function(webhook){
      console.log(webhook.idModel,"->" , model, webhook.callbackURL.substr(0,30))
      if(webhook.idModel == model && webhook.callbackURL.substr(0,30) == "https://living-slash.glitch.me")
      pro.push(deleteWebhook(webhook))   
    })//foreach
    return pro
  })
    .then(function(pro){
    console.log(pro)
    return Promise.all(pro)
  })
    
  }
  
  function createWebhooks(){

  clearWebhooks()

    .then(function(){

    console.log("create")

      Trello.rest("POST", "webhooks", 
                  
              {'idModel': model, 
               'description' : "Checkbox Template", 
               'callbackURL' : "https://living-slash.glitch.me/webhooks?templateBoardId="+templateBoardId+"&templateListName="+templateListName+"&token="+Trello.token()
              }, 
              function(){ 
                p.innerHTML+="Webhook creation : OK"
                status.innerHTML="ok"
                window.opener.done(Trello.token())
                closeTab();
              },
              function(){ 
                p.innerHTML+="Webhook creation : Error (this webhook might already exist)"
                status.innerHTML="ko"
                console.log("error")  
                closeTab();
      });
      
    })
  }
  
  function deleteWebhook(webhook){
    return new Promise(function(resolve){
      Trello.rest("DELETE", "webhooks/"+webhook.id, function(){
        p.innerHTML+="Webhook "+webhook.id+" successfully deleted<br>"
        resolve();
      })
    })
  }
  
  function getWebhooks(callback){
    return new Promise(function(resolve){
      Trello.rest("GET", "tokens/"+Trello.token()+"/webhooks", function(data){
        resolve(data)
      })
    })
  }
  
  function deleteWebhooks(){
      getWebhooks(function(webhooks){
        webhooks.forEach(function(webhook){
          deleteWebhook(webhook, function(){
            p.innerHTML+="Webhook "+webhook.id+" successfully deleted<br>"
          })  
        })
    
      })   
  }
  
  
  
  var authenticationSuccess = function() { 
    console.log('Successful authentication'); 
    p.innerHTML += "Trello authentication : OK<br>"
    
    if(window.location.hash.substr(0,7) == "#deauth"){
      clearWebhooks();
      window.opener.clean()
      closeTab();
    }
      
    else
      createWebhooks();

  };
  
  
  var authenticationFailure = function() { 
    p.innerHTML += "Authentication : Error"
    console.log('Failed authentication'); 
  };

function closeTab(){
  setTimeout(function(){
      close();

  }, 500)
}


  
  
  Trello.authorize({
    type: 'redirect',
    name: 'Trello Template',
    scope: {
      read: 'allowRead',
      write: 'allowWrite' },
    expiration: 'never',
    success: authenticationSuccess,
    error: authenticationFailure
  });
  
  })