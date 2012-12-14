function handleMessage(event) {
  alert("IN PAGE CONTENT" + event);
  alert("SENDING MESSAGE BACK TO GLOBAL");
  //do it  
}

safari.self.addEventListener("message",  handleMessage, false);
 
