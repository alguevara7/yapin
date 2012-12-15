function handleMessage(event) {
  //TODO call back to global page
  if (event.name === "slide-page-in") {
  	alert(event.message);
  }
}

safari.self.addEventListener("message",  handleMessage, false);
