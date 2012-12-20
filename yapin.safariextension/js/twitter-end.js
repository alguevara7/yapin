if (window.top === window){
  TOOLBAR = safari.self.tab
  DISABLED = window.location.href.match(/^https/)
  controller = {}

  function keepalive_trends(){
    safari.self.tab.dispatchMessage('keepalive_trends', true)
  }

  function search_results_are_up(){
    return document.getElementById('twitter_search_results_pane')
  }
  
  function highlight_page_trends(){
    if (DISABLED) {
      TOOLBAR.dispatchMessage("highlight_relevant_data", {url: null, data: ''})
      return
    }
    TOOLBAR.dispatchMessage("highlight_relevant_data",
      {url: window.location.href, data: document.body.innerText})
  }

  controller.show_tweet_prompt = function(message){
    var box = document.getElementById('tweeter_extension_tweetbox')
    if (!box){
      var box = document.createElement("iframe")
      box.id = "tweeter_extension_tweetbox"
      box.width = '520'
      box.height = '205'
      box.onload = function(){
        TOOLBAR.dispatchMessage('proxy_back', [message[0], message[1]])
      }
      box.src = safari.extension.baseURI + 'tweetbox.html'
      document.body.appendChild(box)
    } else {
      TOOLBAR.dispatchMessage('proxy_back', [message.selector, message.options])
    }
  }
  controller.close_composer = function(){
    var tweetbox = document.getElementById('tweeter_extension_tweetbox')
    tweetbox.className += ' fadeout'
    setTimeout(function(){
      document.body.removeChild(document.getElementById('tweeter_extension_tweetbox'))
    }, 600)
    
  }

  controller.send_usernames = function(){
    if (DISABLED || window.location.href.match(/http:\/\/[^\/]*twitter.com/)){
      TOOLBAR.dispatchMessage("show_users_in_toolbar", [])
    } else {
      var user_urls = document.body.innerHTML.match(/http:\/\/twitter.com\/[a-zA-Z_0-9]+/g) || []
      var usernames = []
      var preferred_usernames = []
      for (var i = 0; i < user_urls.length ; i++) {
          var c = user_urls[i].split('/')
          var u = c[c.length - 1]
          usernames.push(u)
          if (window.location.href.toLowerCase().match(u) || document.title.toLowerCase().match(u)){
            preferred_usernames.push(u)
          }
      }
      var links = document.querySelectorAll('link[type="application/twitter"]')
      for (var i = 0; i < links.length ; i++) {
        preferred_usernames.push(links[i].href.match(/http:\/\/twitter.com\/([^\/]+)$/)[1])
      }
      TOOLBAR.dispatchMessage("show_users_in_toolbar", preferred_usernames.reverse().concat(usernames))
    }
  }
  SIDEBAR_STATE = {}
  controller.sidebar = function(options){
    var sidebar = document.getElementById('twitter_search_results_pane')
    if (sidebar){
      if (options['type'])
        SIDEBAR_STATE.type = options.type
      TOOLBAR.dispatchMessage('proxy_back', ['load', options])
    } else {
      var sidebar = document.createElement("iframe")
      sidebar.id = "twitter_search_results_pane"
      sidebar.height = '100%'
      if (options['type'])
        SIDEBAR_STATE.type = options.type
      sidebar.src = safari.extension.baseURI + 'sidebar.html#'
      sidebar.onload = function(){
        TOOLBAR.dispatchMessage('proxy_back', ['load', options])
      }
      document.body.appendChild(sidebar)
    }
  }

  controller.close_search_results = function(){
    document.getElementById('twitter_search_results_pane').className += " slideout"
    SIDEBAR_STATE = {}
    setTimeout(function(){
      document.body.removeChild(document.getElementById('twitter_search_results_pane'))
      controller.send_toggled_buttons()
    }, 500)
    return false
  }
  controller.open_tweetie = function(){
    var text = ''
    text += '"' + (LAST_SELECTION.length == 0 ? document.title : LAST_SELECTION) + '" '
    text += window.location
    window.location='tweetie:'+ text
  }

  controller.send_toggled_buttons = function(){
    var toggled = {}
    if (SIDEBAR_STATE['type'] == 'related'){
      toggled.related = true
    }
    TOOLBAR.dispatchMessage('set_toggled_buttons', toggled)
  }
  controller.send_toolbar_info = function(){
    controller.send_toggled_buttons()
    keepalive_trends()
    highlight_page_trends()
    controller.send_usernames()
  }

  controller.send_selection_for_tweet = function(message){
    TOOLBAR.dispatchMessage('compose_tweet_request', {'quote': (LAST_SELECTION.length == 0 ? document.title : LAST_SELECTION), url:window.location.href})
    LAST_SELECTION = ''
  }

  function dispatcher(message){
    if (controller[message.name]) {
      controller[message.name](message.message)
    } else {
    }
  }
  safari.self.addEventListener("message", dispatcher, false)

  window.addEventListener('focus', controller.send_toolbar_info)
  TOOLBAR.dispatchMessage('loaded', window.location.href)

  LAST_SELECTION = ''
  window.addEventListener('mouseup', function(){
    LAST_SELECTION = String(window.getSelection())
  })
}